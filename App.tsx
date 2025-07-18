import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GeoPoint, AreaUnit } from './types';
import { calculatePolygonArea } from './services/areaCalculator';
import { UNIT_CONVERSIONS, UNIT_LABELS } from './constants';
import { StartIcon, StopIcon, MapPinIcon, DownloadIcon, AlertIcon, CrosshairsIcon } from './components/Icons';
import { Card } from './components/Card';
import { Button } from './components/Button';

const App: React.FC = () => {
    const [isTracking, setIsTracking] = useState<boolean>(false);
    const [path, setPath] = useState<GeoPoint[]>([]);
    const [area, setArea] = useState<number | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<AreaUnit>(AreaUnit.SQ_METERS);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [isGeoSupported, setIsGeoSupported] = useState<boolean>(true);
    const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setIsGeoSupported(false);
            setError("Geolocation is not supported by your browser. This app cannot function without it.");
        }
    }, []);

    const handleSuccess: PositionCallback = (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setPath(prevPath => [...prevPath, { lat: latitude, lng: longitude }]);
        setCurrentAccuracy(accuracy);
        if (error) setError(null);
    };

    const handleError: PositionErrorCallback = (err) => {
        setIsTracking(false);
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        let message = '';
        switch (err.code) {
            case 1: // PERMISSION_DENIED
                message = "Location permission denied. Please enable it in your browser/system settings.";
                break;
            case 2: // POSITION_UNAVAILABLE
                message = "Location data is unavailable. Please move to an open area with a clear view of the sky.";
                break;
            case 3: // TIMEOUT
                message = "Could not get location in time. Please check your network or GPS signal.";
                break;
            default:
                message = `An unknown location error occurred: ${err.message}`;
                break;
        }
        setError(message);
    };

    const startTracking = () => {
        if (!isGeoSupported) {
            return;
        }
        setError(null);
        setPath([]);
        setArea(null);
        setCurrentAccuracy(null);
        setIsTracking(true);
        const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
        setWatchId(id);
    };

    const stopTracking = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsTracking(false);
        setCurrentAccuracy(null);
        if (path.length > 2) {
            const calculatedArea = calculatePolygonArea(path);
            setArea(calculatedArea);
        } else {
            setArea(null);
            if(path.length > 0) {
                 setError("Not enough points to form a shape. Please record at least 3 points by walking the perimeter.");
            }
        }
    }, [watchId, path]);

    const handleToggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    };
    
    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

    const exportToCSV = () => {
        if (path.length === 0) return;
        const header = "Latitude,Longitude\n";
        const csvContent = path.map(p => `${p.lat},${p.lng}`).join("\n");
        const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "walk_path.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const convertedArea = useMemo(() => {
        if (area === null) return 0;
        return area * UNIT_CONVERSIONS[selectedUnit];
    }, [area, selectedUnit]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6">
            <main className="w-full max-w-2xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                        Geo Area Calculator
                    </h1>
                    <p className="mt-2 text-slate-400">Walk the perimeter of your land to measure its area.</p>
                </header>

                <Card>
                    <div className="flex flex-col items-center space-y-6">
                        <Button
                            onClick={handleToggleTracking}
                            disabled={!isGeoSupported}
                            className={`w-48 h-16 text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                            } disabled:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isTracking ? <StopIcon /> : <StartIcon />}
                            <span>{isTracking ? 'Stop Walk' : 'Start Walk'}</span>
                        </Button>
                        <div className="text-center text-slate-400">
                            <p className="font-semibold text-lg text-slate-300">
                                Status: <span className={`font-bold ${isTracking ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
                                    {isTracking ? 'Tracking...' : 'Idle'}
                                </span>
                            </p>
                            <p className="mt-1 flex items-center justify-center space-x-2">
                                <MapPinIcon />
                                <span>{path.length} points recorded</span>
                            </p>
                            {isTracking && currentAccuracy !== null && (
                                 <p className="mt-1 flex items-center justify-center space-x-2 text-sm">
                                    <CrosshairsIcon />
                                    <span>Accuracy: {currentAccuracy.toFixed(1)}m</span>
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start space-x-3" role="alert">
                        <AlertIcon />
                        <div>
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                        </div>
                    </div>
                )}

                {area !== null && (
                    <Card>
                        <h2 className="text-2xl font-bold text-center text-slate-100 mb-4">Measurement Result</h2>
                        <div className="text-center my-4">
                            <p className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                                {convertedArea.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                            </p>
                            <p className="text-xl text-slate-400 mt-1">{UNIT_LABELS[selectedUnit]}</p>
                        </div>
                        <div className="flex justify-center flex-wrap gap-2 mt-6">
                            {(Object.keys(AreaUnit) as Array<keyof typeof AreaUnit>).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedUnit(AreaUnit[key])}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        selectedUnit === AreaUnit[key] 
                                        ? 'bg-emerald-500 text-white shadow-lg' 
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                    }`}
                                >
                                    {AreaUnit[key]}
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
                
                {path.length > 0 && (
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-2xl font-bold text-slate-100">Recorded Path</h2>
                             <Button onClick={exportToCSV} className="bg-slate-700 hover:bg-slate-600 text-sm py-2 px-3">
                                <DownloadIcon />
                                <span>Export CSV</span>
                             </Button>
                        </div>
                        <div className="h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                             <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr>
                                        <th className="p-2">Point #</th>
                                        <th className="p-2">Latitude</th>
                                        <th className="p-2">Longitude</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {path.map((point, index) => (
                                        <tr key={index} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-700/50">
                                            <td className="p-2 font-mono">{index + 1}</td>
                                            <td className="p-2 font-mono">{point.lat.toFixed(6)}</td>
                                            <td className="p-2 font-mono">{point.lng.toFixed(6)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default App;