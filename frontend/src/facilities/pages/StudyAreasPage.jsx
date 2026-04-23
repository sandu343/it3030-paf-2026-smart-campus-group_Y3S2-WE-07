import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextObject';
import { BookOpen, Users } from 'lucide-react';
import PortalHeader from '../../components/PortalHeader';
import {
  checkInUserLocation,
  getStudyAreaActiveMembers,
  getStudyAreaOccupancy,
  getStudyAreasForUser,
} from '../services/facilitiesService';

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

  const displayStudyAreas = useMemo(() => (Array.isArray(studyAreas) ? studyAreas : []), [studyAreas]);

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

  const getOccupancyPercentage = (activeCount, capacity) => {
    const normalizedCapacity = Number(capacity) || 0;
    if (normalizedCapacity <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((Number(activeCount) / normalizedCapacity) * 100));
  };

  const getOccupancyState = (activeCount, capacity) => {
    const normalizedCapacity = Number(capacity) || 0;
    if (normalizedCapacity <= 0) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        cardClass: 'border-blue-100 bg-white',
        barClass: 'bg-emerald-500',
      };
    }

    const percentage = (Number(activeCount) / normalizedCapacity) * 100;

    if (percentage < 50) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800',
        cardClass: 'border-blue-100 bg-white',
        barClass: 'bg-emerald-500',
      };
    }

    if (percentage <= 90) {
      return {
        label: 'Busy',
        badgeClass: 'bg-amber-100 text-amber-800',
        cardClass: 'border-blue-100 bg-white',
        barClass: 'bg-amber-500',
      };
    }

    return {
      label: 'Crowded',
      badgeClass: 'bg-rose-100 text-rose-800',
      cardClass: 'border-blue-100 bg-white',
      barClass: 'bg-rose-500',
    };
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_680px_at_10%_-10%,rgba(59,130,246,0.10)_0%,#F8FAFC_42%,#F5F7FA_100%)] text-slate-900">
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

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1E3A8A]">Smart Campus</p>
            <h1 className="text-2xl font-black text-[#1E3A8A]">Study Areas</h1>
            <p className="mt-1 text-sm text-slate-600">Available study areas for students.</p>
            {locationInfo && <p className="mt-2 text-xs font-medium text-[#1E3A8A]">{locationInfo}</p>}
          </div>
        </div>

        {loading && <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading study areas...</p>}

        {!loading && error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && displayStudyAreas.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No study areas available right now.
          </p>
        )}

        {!loading && !error && displayStudyAreas.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayStudyAreas.map((area) => {
              const radius = Number(area.mapRadiusMeters) || 50;
              const activeCount = occupancyMap[area.id] || 0;
              const activeMembers = activeMembersMap[area.id] || [];
              const inside = isUserInsideArea(area);
              const occupancyPercent = getOccupancyPercentage(activeCount, area.capacity);
              const occupancyState = getOccupancyState(activeCount, area.capacity);

              return (
                <article key={area.id} className={`rounded-3xl border p-5 shadow-sm ${occupancyState.cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="inline-flex items-center gap-2 text-lg font-bold text-[#1E3A8A]">
                      <BookOpen className="h-5 w-5 text-[#3B82F6]" />
                      {area.hallName}
                    </h2>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                      {activeCount}/{area.capacity || 0}
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                        <Users className="h-3.5 w-3.5" />
                        {activeMembers.length}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Capacity: {area.capacity || 0}</p>

                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${occupancyState.badgeClass}`}>
                      <span className={`h-2 w-2 rounded-full ${occupancyState.barClass}`} />
                      {occupancyState.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Current Students</span>
                      <span>{occupancyPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${occupancyState.barClass}`}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Radius limit: {radius}m
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
