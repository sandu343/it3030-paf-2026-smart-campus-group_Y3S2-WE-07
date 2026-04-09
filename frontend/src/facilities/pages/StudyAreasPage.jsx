import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Circle, CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import { ArrowLeft, BookOpen, MapPin, Users } from 'lucide-react';
import PortalHeader from '../../components/PortalHeader';
import {
  checkInUserLocation,
  getStudyAreaActiveMembers,
  getStudyAreaOccupancy,
  getStudyAreasForUser,
} from '../services/facilitiesService';
import 'leaflet/dist/leaflet.css';

const LOCATION_CHECKIN_INTERVAL_MS = 60 * 1000;
const OCCUPANCY_REFRESH_INTERVAL_MS = 20 * 1000;
const LOCATION_PROMPT_DISMISSED_KEY = 'studyAreaLocationPromptDismissed';

export default function StudyAreasPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const hasGeolocation = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  const savedLocationPreference = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studyAreaLocationPreference')
    : null;

  const [studyAreas, setStudyAreas] = useState([]);
  const [occupancyMap, setOccupancyMap] = useState({});
  const [activeMembersMap, setActiveMembersMap] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationInfo, setLocationInfo] = useState('');
  const [locationAccessEnabled, setLocationAccessEnabled] = useState(
    hasGeolocation && savedLocationPreference === 'enabled',
  );
  const [showLocationPopup, setShowLocationPopup] = useState(() => {
    if (!hasGeolocation || savedLocationPreference === 'enabled') {
      return false;
    }

    if (typeof sessionStorage === 'undefined') {
      return true;
    }

    return sessionStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) !== 'true';
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const loadStudyAreas = async () => {
      try {
        setLoading(true);
        setError('');
        const [areas, occupancy, activeMembers] = await Promise.all([
          getStudyAreasForUser(),
          getStudyAreaOccupancy(),
          getStudyAreaActiveMembers(),
        ]);

        setStudyAreas(Array.isArray(areas) ? areas : []);

        const nextOccupancy = {};
        (Array.isArray(occupancy) ? occupancy : []).forEach((item) => {
          nextOccupancy[item.studyAreaId] = item.activeUserCount;
        });
        setOccupancyMap(nextOccupancy);

        const nextActiveMembers = {};
        (Array.isArray(activeMembers) ? activeMembers : []).forEach((item) => {
          nextActiveMembers[item.studyAreaId] = Array.isArray(item.activeMembers) ? item.activeMembers : [];
        });
        setActiveMembersMap(nextActiveMembers);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load study areas');
      } finally {
        setLoading(false);
      }
    };

    loadStudyAreas();
  }, []);

  useEffect(() => {
    let watchId;

    const startLocationFlow = () => {
      if (!navigator.geolocation) {
        setLocationInfo('Browser does not support location services.');
        return;
      }

      const onSuccess = async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(nextLocation);

        try {
          const response = await checkInUserLocation(nextLocation.latitude, nextLocation.longitude);
          setLocationInfo(`Location active. Auto reset in ${response.expiresInSeconds} seconds.`);
        } catch (err) {
          setLocationInfo(err?.response?.data?.message || 'Failed to send location.');
        }
      };

      const onError = () => {
        setLocationInfo('Location permission denied or unavailable.');
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      });

      watchId = window.setInterval(async () => {
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        });
      }, LOCATION_CHECKIN_INTERVAL_MS);
    };

    if (locationAccessEnabled) {
      startLocationFlow();
    }

    return () => {
      if (watchId) {
        window.clearInterval(watchId);
      }
    };
  }, [locationAccessEnabled]);

  const enableLocationSharing = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studyAreaLocationPreference', 'enabled');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
    }
    setLocationAccessEnabled(true);
    setShowLocationPopup(false);
  };

  const skipLocationSharing = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studyAreaLocationPreference', 'disabled');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, 'true');
    }
    setLocationAccessEnabled(false);
    setShowLocationPopup(false);
    setLocationInfo('Location sharing is turned off.');
  };

  const toggleLocationSharing = () => {
    if (locationAccessEnabled) {
      skipLocationSharing();
    } else {
      enableLocationSharing();
    }
  };

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        const [occupancy, activeMembers] = await Promise.all([
          getStudyAreaOccupancy(),
          getStudyAreaActiveMembers(),
        ]);

        const nextOccupancy = {};
        (Array.isArray(occupancy) ? occupancy : []).forEach((item) => {
          nextOccupancy[item.studyAreaId] = item.activeUserCount;
        });
        setOccupancyMap(nextOccupancy);

        const nextActiveMembers = {};
        (Array.isArray(activeMembers) ? activeMembers : []).forEach((item) => {
          nextActiveMembers[item.studyAreaId] = Array.isArray(item.activeMembers) ? item.activeMembers : [];
        });
        setActiveMembersMap(nextActiveMembers);
      } catch {
        // Ignore transient refresh errors to keep the page stable.
      }
    }, OCCUPANCY_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const mappedStudyAreas = useMemo(
    () => studyAreas.filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))),
    [studyAreas],
  );

  const getZoomForRadius = (radiusMeters) => {
    if (radiusMeters <= 30) return 20;
    if (radiusMeters <= 60) return 19;
    if (radiusMeters <= 120) return 18;
    return 17;
  };

  const distanceMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const isUserInsideArea = (area) => {
    if (!userLocation) {
      return false;
    }

    const radius = Number(area.mapRadiusMeters) || 50;
    return distanceMeters(
      Number(area.latitude),
      Number(area.longitude),
      userLocation.latitude,
      userLocation.longitude,
    ) <= radius;
  };

  const getCircleColors = (activeCount, capacity) => {
    const normalizedCapacity = Number(capacity) || 0;
    if (normalizedCapacity <= 0) {
      return { stroke: '#16a34a', fill: '#86efac' };
    }

    const percentage = (Number(activeCount) / normalizedCapacity) * 100;

    if (percentage < 50) {
      return { stroke: '#16a34a', fill: '#86efac' };
    }

    if (percentage <= 90) {
      return { stroke: '#ca8a04', fill: '#fde047' };
    }

    return { stroke: '#dc2626', fill: '#fca5a5' };
  };

  const getOccupancyState = (activeCount, capacity) => {
    const normalizedCapacity = Number(capacity) || 0;
    if (normalizedCapacity <= 0) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        cardClass: 'border-emerald-200 bg-emerald-50/40',
      };
    }

    const percentage = (Number(activeCount) / normalizedCapacity) * 100;

    if (percentage < 50) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        cardClass: 'border-emerald-200 bg-emerald-50/40',
      };
    }

    if (percentage <= 90) {
      return {
        label: 'Busy',
        badgeClass: 'bg-amber-100 text-amber-800',
        cardClass: 'border-amber-200 bg-amber-50/50',
      };
    }

    return {
      label: 'Crowded',
      badgeClass: 'bg-rose-100 text-rose-800',
      cardClass: 'border-rose-200 bg-rose-50/50',
    };
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,#dcfce7_0%,#f8fafc_42%,#f0fdf4_100%)] text-slate-900">
      <PortalHeader
        user={user}
        onLogout={logout}
        onBack={() => navigate('/dashboard')}
        showBackButton
        isLocationEnabled={locationAccessEnabled}
        onToggleLocation={toggleLocationSharing}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      {showLocationPopup && (
        <div className="fixed right-4 top-24 z-50 w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:right-6 sm:top-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Location Access</p>
              <h2 className="mt-2 text-xl font-extrabold text-emerald-900">Turn on location?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enable location to mark your position on study area maps and live occupancy.
              </p>
            </div>
            <button
              type="button"
              onClick={skipLocationSharing}
              className="rounded-full px-2 py-1 text-sm font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss location prompt"
            >
              ×
            </button>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={skipLocationSharing}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Not now
            </button>
            <button
              onClick={enableLocationSharing}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Enable Location
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Smart Campus</p>
            <h1 className="text-2xl font-black text-emerald-900">Study Areas</h1>
            <p className="mt-1 text-sm text-slate-600">Available study areas for students.</p>
            {locationInfo && <p className="mt-2 text-xs font-medium text-emerald-700">{locationInfo}</p>}
          </div>
        </div>

        {loading && <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading study areas...</p>}

        {!loading && error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && mappedStudyAreas.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No study areas available right now.
          </p>
        )}

        {!loading && !error && mappedStudyAreas.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mappedStudyAreas.map((area) => {
              const center = [Number(area.latitude), Number(area.longitude)];
              const radius = Number(area.mapRadiusMeters) || 50;
              const mapZoom = getZoomForRadius(radius);
              const activeCount = occupancyMap[area.id] || 0;
              const activeMembers = activeMembersMap[area.id] || [];
              const inside = isUserInsideArea(area);
              const circleColors = getCircleColors(activeCount, area.capacity);
              const occupancyState = getOccupancyState(activeCount, area.capacity);

              return (
                <article key={area.id} className={`rounded-3xl border p-5 shadow-sm ${occupancyState.cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="inline-flex items-center gap-2 text-lg font-bold text-emerald-900">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      {area.hallName}
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {radius} m
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">Building: {area.buildingName || '-'}</p>
                    <div className="flex items-center gap-2">
                      {inside && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                          </span>
                          You are here
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                        <Users className="h-3.5 w-3.5" />
                        {activeCount}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Capacity: {area.capacity || 0}</p>

                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${occupancyState.badgeClass}`}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: circleColors.stroke }} />
                      {occupancyState.label}
                    </span>
                  </div>

                  <div className="mt-3 h-44 overflow-hidden rounded-2xl border border-slate-200">
                    <MapContainer
                      center={center}
                      zoom={mapZoom}
                      className="h-full w-full"
                      scrollWheelZoom={false}
                      dragging={false}
                      doubleClickZoom={false}
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <CircleMarker
                        center={center}
                        radius={8}
                        pathOptions={{ color: '#166534', fillColor: '#22c55e', fillOpacity: 0.95 }}
                      />
                      <Circle
                        center={center}
                        radius={radius}
                        pathOptions={{ color: circleColors.stroke, fillColor: circleColors.fill, fillOpacity: 0.25 }}
                      />
                      {activeMembers.map((member, index) => (
                        <CircleMarker
                          key={`${member.userId || 'member'}-${index}`}
                          center={[Number(member.latitude), Number(member.longitude)]}
                          radius={5}
                          pathOptions={{ color: '#7c3aed', fillColor: '#8b5cf6', fillOpacity: 0.95 }}
                        />
                      ))}
                      {userLocation && (
                        <CircleMarker
                          center={[userLocation.latitude, userLocation.longitude]}
                          radius={6}
                          pathOptions={{
                            color: inside ? '#0f766e' : '#1d4ed8',
                            fillColor: inside ? '#14b8a6' : '#3b82f6',
                            fillOpacity: 0.95,
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>

                  <a
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    href={`https://www.openstreetmap.org/?mlat=${Number(area.latitude)}&mlon=${Number(area.longitude)}#map=${mapZoom}/${Number(area.latitude)}/${Number(area.longitude)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    Open location
                  </a>

                  <p className="mt-2 text-xs text-slate-500">
                    {Number(area.latitude).toFixed(6)}, {Number(area.longitude).toFixed(6)}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
