import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import {
  Building2,
  CalendarCheck2,
  Eye,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldUser,
  Ticket,
  Trash2,
  UserRound,
  Users,
  X,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContextObject';
import NotificationBell from '../components/NotificationBell';
import NotificationDropdown from '../components/NotificationDropdown';
import 'leaflet/dist/leaflet.css';
import {
  getStudyAreaActiveMembers,
  getStudyAreaOccupancy,
} from '../facilities/services/facilitiesService';
import {
  createBuilding,
  createResource,
  deleteBuilding,
  deleteResource,
  getBuildings,
  getResources,
  updateBuilding,
  updateResource,
} from '../services/adminResourceService';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Resources', icon: Building2, to: '/admin/resources', active: true },
  { label: 'Manage Technicians', icon: Wrench, to: '/admin/technicians' },
  { label: 'Manage Bookings', icon: CalendarCheck2, to: '/admin/bookings' },
  { label: 'Manage Tickets', icon: Ticket, to: '/admin/tickets' },
];

const RESOURCE_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'STUDY_AREA', label: 'Study Area' },
];

const RESOURCE_STATUSES = [
  { value: 'AVAILABLE', label: 'ACTIVE' },
  { value: 'UNAVAILABLE', label: 'OUT_OF_SERVICE' },
  { value: 'UNDER_MAINTENANCE', label: 'UNDER_MAINTENANCE' },
];

const resourceTypeLabelMap = Object.fromEntries(RESOURCE_TYPES.map((item) => [item.value, item.label]));
const resourceStatusLabelMap = Object.fromEntries(RESOURCE_STATUSES.map((item) => [item.value, item.label]));

const buildingRowTemplate = (index = 0) => ({
  blockName: String.fromCharCode(65 + index),
  floorCount: 1,
});

const emptyBuildingForm = () => ({
  buildingName: '',
  blockCount: '',
  blocks: [],
});

const emptyResourceForm = () => ({
  resourceType: 'LECTURE_HALL',
  buildingId: '',
  blockName: '',
  floorNumber: 1,
  hallNumber: 1,
  hallName: '',
  capacity: 1,
  status: 'AVAILABLE',
  description: '',
  latitude: '',
  longitude: '',
  mapRadiusMeters: 50,
  projectorCount: 0,
  cameraCount: 0,
  pcCount: 0,
});

const normalizeSearchValue = (value) => `${value ?? ''}`.trim().toLowerCase();

const statusStyles = {
  AVAILABLE: 'bg-green-100 text-green-800 ring-green-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-700 ring-slate-200',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
};

function Badge({ value }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[value] || statusStyles.UNAVAILABLE}`}>
      {resourceStatusLabelMap[value] || value.replaceAll('_', ' ')}
    </span>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }) {
  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:border-r xl:border-blue-100 xl:bg-white">
      <div className="flex items-center gap-3 border-b border-blue-100 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white">
          <ShieldUser className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">Smart Campus</p>
          <h1 className="text-lg font-extrabold text-slate-900">Operations Hub</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                item.active ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-blue-100 px-6 py-6">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function TopNavbar({ onLogout, user, isNotificationOpen, setIsNotificationOpen }) {
  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 text-blue-800 xl:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">Smart Campus Admin</p>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Resources Catalogue</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <NotificationBell onBellClick={() => setIsNotificationOpen((value) => !value)} />
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin'}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function ModalShell({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewController({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function StudyAreaLocationPicker({ latitude, longitude, radius, onPick }) {
  const hasPoint = latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const center = hasPoint ? [Number(latitude), Number(longitude)] : [6.9068, 79.8703];

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Click on the map to set the study area center point.</p>
      <div className="h-64 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={center} zoom={16} className="h-full w-full">
          <MapViewController center={center} />
          <MapClickHandler onPick={onPick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPoint && (
            <>
              <CircleMarker center={center} radius={7} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 }} />
              <Circle center={center} radius={Number(radius) || 50} pathOptions={{ color: '#2563eb', fillColor: '#93c5fd', fillOpacity: 0.22 }} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

const AdminResourcesPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('buildings');
  const [buildings, setBuildings] = useState([]);
  const [resources, setResources] = useState([]);
  const [studyAreaResources, setStudyAreaResources] = useState([]);
  const [studyAreaOccupancy, setStudyAreaOccupancy] = useState({});
  const [studyAreaActiveMembers, setStudyAreaActiveMembers] = useState({});
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingStudyAreas, setLoadingStudyAreas] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [buildingSaving, setBuildingSaving] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [buildingForm, setBuildingForm] = useState(emptyBuildingForm());
  const [resourceForm, setResourceForm] = useState(emptyResourceForm());
  const [buildingErrors, setBuildingErrors] = useState({});
  const [resourceErrors, setResourceErrors] = useState({});
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resourceFilters, setResourceFilters] = useState({ search: '', resourceType: '', buildingId: '', status: '', location: '', capacityMin: '' });
  const [locating, setLocating] = useState(false);
  const blockNameRefs = useRef([]);
  const floorCountRefs = useRef([]);

  const selectedBuilding = useMemo(
    () => buildings.find((item) => item.id === resourceForm.buildingId) || null,
    [buildings, resourceForm.buildingId]
  );

  const selectedBlock = useMemo(() => {
    if (!selectedBuilding || !resourceForm.blockName) {
      return null;
    }
    return selectedBuilding.blocks?.find((block) => block.blockName === resourceForm.blockName) || null;
  }, [resourceForm.blockName, selectedBuilding]);

  const stats = useMemo(() => {
    const buildingCount = buildings.length;
    const resourceCount = resources.length;
    const availableCount = resources.filter((item) => item.status === 'AVAILABLE').length;
    const maintenanceCount = resources.filter((item) => item.status === 'UNDER_MAINTENANCE').length;
    return { buildingCount, resourceCount, availableCount, maintenanceCount };
  }, [buildings.length, resources]);

  const listedStudyAreas = useMemo(() => studyAreaResources, [studyAreaResources]);

  const visibleResources = useMemo(() => {
    const search = normalizeSearchValue(resourceFilters.search);
    const location = normalizeSearchValue(resourceFilters.location);
    const minCapacity = resourceFilters.capacityMin === '' ? null : Number(resourceFilters.capacityMin);

    return resources.filter((resource) => {
      const matchesSearch = !search || [
        resource.hallName,
        resource.buildingName,
        resource.blockName,
        resource.description,
        resource.resourceType,
        resource.status,
        resource.projectorCount,
        resource.cameraCount,
        resource.pcCount,
      ].some((field) => normalizeSearchValue(field).includes(search));

      const matchesLocation = !location || [resource.buildingName, resource.blockName, resource.hallName, resource.description].some((field) => normalizeSearchValue(field).includes(location));
      const matchesCapacity = minCapacity === null || Number(resource.capacity) >= minCapacity;

      return matchesSearch && matchesLocation && matchesCapacity;
    });
  }, [resourceFilters.capacityMin, resourceFilters.location, resourceFilters.search, resources]);

  const getOccupancyState = (activeCount, capacity) => {
    const normalizedCapacity = Number(capacity) || 0;

    if (normalizedCapacity <= 0) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
        cardClass: 'border-emerald-200 bg-emerald-50/40',
      };
    }

    const percentage = (Number(activeCount) / normalizedCapacity) * 100;

    if (percentage < 50) {
      return {
        label: 'Normal',
        badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
        cardClass: 'border-emerald-200 bg-emerald-50/40',
      };
    }

    if (percentage <= 90) {
      return {
        label: 'Busy',
        badgeClass: 'bg-amber-100 text-amber-800 ring-amber-200',
        cardClass: 'border-amber-200 bg-amber-50/50',
      };
    }

    return {
      label: 'Crowded',
      badgeClass: 'bg-rose-100 text-rose-800 ring-rose-200',
      cardClass: 'border-rose-200 bg-rose-50/50',
    };
  };

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const focusBlockName = (index) => {
    blockNameRefs.current[index]?.focus();
  };

  const focusFloorCount = (index) => {
    floorCountRefs.current[index]?.focus();
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadBuildings = useCallback(async () => {
    try {
      setLoadingBuildings(true);
      const data = await getBuildings();
      setBuildings(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  }, []);

  const loadResources = useCallback(async (filters = {}) => {
    try {
      setLoadingResources(true);
      const data = await getResources(filters);
      setResources(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load resources');
    } finally {
      setLoadingResources(false);
    }
  }, []);

  const loadStudyAreas = useCallback(async () => {
    try {
      setLoadingStudyAreas(true);
      const [resourceData, occupancyData, activeMembersData] = await Promise.all([
        getResources({ resourceType: 'STUDY_AREA' }),
        getStudyAreaOccupancy(),
        getStudyAreaActiveMembers(),
      ]);

      setStudyAreaResources(Array.isArray(resourceData) ? resourceData : []);

      const nextOccupancy = {};
      (Array.isArray(occupancyData) ? occupancyData : []).forEach((item) => {
        nextOccupancy[item.studyAreaId] = item.activeUserCount;
      });
      setStudyAreaOccupancy(nextOccupancy);

      const nextActiveMembers = {};
      (Array.isArray(activeMembersData) ? activeMembersData : []).forEach((item) => {
        nextActiveMembers[item.studyAreaId] = Array.isArray(item.activeMembers) ? item.activeMembers : [];
      });
      setStudyAreaActiveMembers(nextActiveMembers);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load study areas');
    } finally {
      setLoadingStudyAreas(false);
    }
  }, []);

  useEffect(() => {
    loadBuildings();
    loadResources();
    loadStudyAreas();
  }, [loadBuildings, loadResources, loadStudyAreas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResources(resourceFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [loadResources, resourceFilters]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadStudyAreas();
    }, 20 * 1000);

    return () => window.clearInterval(intervalId);
  }, [loadStudyAreas]);

  useEffect(() => {
    if (!resourceForm.buildingId || !selectedBuilding) {
      return;
    }

    const blockExists = selectedBuilding.blocks?.some((block) => block.blockName === resourceForm.blockName);
    if (!blockExists && selectedBuilding.blocks?.length > 0) {
      const firstBlock = selectedBuilding.blocks[0].blockName;
      setResourceForm((prev) => ({ ...prev, blockName: firstBlock, floorNumber: 1, hallName: generateHallName(firstBlock, 1, prev.hallNumber) }));
    }
  }, [resourceForm.buildingId, resourceForm.blockName, selectedBuilding]);

  useEffect(() => {
    if (!resourceForm.blockName || !resourceForm.floorNumber || !resourceForm.hallNumber) {
      return;
    }
    setResourceForm((prev) => ({
      ...prev,
      hallName: generateHallName(prev.blockName, prev.floorNumber, prev.hallNumber),
    }));
  }, [resourceForm.blockName, resourceForm.floorNumber, resourceForm.hallNumber]);

  const validateBuildingForm = () => {
    const nextErrors = { blocks: [] };
    const buildingName = buildingForm.buildingName.trim();
    const blockCount = buildingForm.blockCount === '' ? 0 : Number(buildingForm.blockCount);

    if (!buildingName) {
      nextErrors.buildingName = 'Building name is required';
    }

    if (!Number.isInteger(blockCount) || blockCount < 0) {
      nextErrors.blockCount = 'Block count must be 0 or more';
    } else if (blockCount > 4) {
      nextErrors.blockCount = 'Block count cannot exceed 4';
    }

    if (blockCount === 0) {
      if (buildingForm.blocks.length !== 0) {
        nextErrors.blockCount = 'Remove all block rows when block count is 0';
      }
    } else if (buildingForm.blocks.length !== blockCount) {
      nextErrors.blockCount = 'Number of blocks must match block count';
    }

    const seenBlocks = new Set();
    buildingForm.blocks.forEach((block, index) => {
      const rowErrors = {};
      const blockName = (block.blockName || '').trim().toUpperCase();
      const floorCount = Number(block.floorCount);

      if (!/^[A-Z]$/.test(blockName)) {
        rowErrors.blockName = 'Use a single uppercase letter';
      }

      if (seenBlocks.has(blockName)) {
        rowErrors.blockName = 'Duplicate block name in the same building';
      }

      if (blockName) {
        seenBlocks.add(blockName);
      }

      if (!Number.isInteger(floorCount) || floorCount < 1) {
        rowErrors.floorCount = 'Floor count must be greater than 0';
      } else if (floorCount > 18) {
        rowErrors.floorCount = 'Floor count cannot exceed 18';
      }

      nextErrors.blocks[index] = rowErrors;
    });

    setBuildingErrors(nextErrors);
    const hasBlockRowErrors = nextErrors.blocks.some((row) => row && Object.keys(row).length > 0);
    return Object.keys(nextErrors).filter((key) => key !== 'blocks').length === 0 && !hasBlockRowErrors;
  };

  const validateResourceForm = () => {
    const nextErrors = {};

    if (!resourceForm.resourceType) nextErrors.resourceType = 'Resource type is required';
    if (!resourceForm.buildingId) nextErrors.buildingId = 'Building is required';
    if (!resourceForm.blockName) nextErrors.blockName = 'Block is required';
    if (!Number.isInteger(Number(resourceForm.floorNumber)) || Number(resourceForm.floorNumber) < 1) {
      nextErrors.floorNumber = 'Floor number must be greater than 0';
    }
    if (!Number.isInteger(Number(resourceForm.hallNumber)) || Number(resourceForm.hallNumber) < 1 || Number(resourceForm.hallNumber) > 99) {
      nextErrors.hallNumber = 'Hall number must be between 1 and 99';
    }
    if (!Number.isInteger(Number(resourceForm.capacity)) || Number(resourceForm.capacity) < 1) {
      nextErrors.capacity = 'Capacity must be greater than 0';
    }

    if (!Number.isInteger(Number(resourceForm.projectorCount)) || Number(resourceForm.projectorCount) < 0) {
      nextErrors.projectorCount = 'Projector count must be 0 or more';
    }
    if (!Number.isInteger(Number(resourceForm.cameraCount)) || Number(resourceForm.cameraCount) < 0) {
      nextErrors.cameraCount = 'Camera count must be 0 or more';
    }
    if (!Number.isInteger(Number(resourceForm.pcCount)) || Number(resourceForm.pcCount) < 0) {
      nextErrors.pcCount = 'PC count must be 0 or more';
    }

    if (resourceForm.resourceType === 'STUDY_AREA') {
      const lat = Number(resourceForm.latitude);
      const lng = Number(resourceForm.longitude);
      const radius = Number(resourceForm.mapRadiusMeters);

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        nextErrors.latitude = 'Latitude must be between -90 and 90';
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        nextErrors.longitude = 'Longitude must be between -180 and 180';
      }
      if (!Number.isInteger(radius) || radius < 1) {
        nextErrors.mapRadiusMeters = 'Radius must be greater than 0';
      }
    }

    if (selectedBlock && Number(resourceForm.floorNumber) > Number(selectedBlock.floorCount)) {
      nextErrors.floorNumber = 'Floor number cannot exceed the selected block floor count';
    }

    setResourceErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openBuildingModal = (building = null) => {
    if (building) {
      setEditingBuildingId(building.id);
      setBuildingForm({
        buildingName: building.buildingName || '',
        blockCount: building.blockCount || 1,
        blocks:
          building.blocks?.map((block) => ({
            blockName: block.blockName || '',
            floorCount: block.floorCount || 1,
          })) || [buildingRowTemplate(0)],
      });
    } else {
      setEditingBuildingId(null);
      setBuildingForm(emptyBuildingForm());
    }
    blockNameRefs.current = [];
    floorCountRefs.current = [];
    setBuildingErrors({});
    setBuildingModalOpen(true);
  };

  const openResourceModal = (resource = null) => {
    if (resource) {
      setEditingResourceId(resource.id);
      setResourceForm({
        resourceType: resource.resourceType || 'LECTURE_HALL',
        buildingId: resource.buildingId || '',
        blockName: resource.blockName || '',
        floorNumber: resource.floorNumber || 1,
        hallNumber: resource.hallNumber || 1,
        hallName: resource.hallName || '',
        capacity: resource.capacity || 1,
        status: resource.status || 'AVAILABLE',
        description: resource.description || '',
        latitude: resource.latitude ?? '',
        longitude: resource.longitude ?? '',
        mapRadiusMeters: resource.mapRadiusMeters ?? 50,
        projectorCount: resource.projectorCount ?? 0,
        cameraCount: resource.cameraCount ?? 0,
        pcCount: resource.pcCount ?? 0,
      });
    } else {
      setEditingResourceId(null);
      setResourceForm({
        ...emptyResourceForm(),
        buildingId: '',
        blockName: '',
        floorNumber: 1,
        hallName: '',
      });
    }
    setLocating(false);
    setResourceErrors({});
    setResourceModalOpen(true);
  };

  const closeModals = () => {
    setBuildingModalOpen(false);
    setResourceModalOpen(false);
    setDetailItem(null);
    setConfirmDelete(null);
  };

  const handleBuildingCountChange = (value) => {
    if (value === '') {
      setBuildingForm((prev) => ({ ...prev, blockCount: '', blocks: [] }));
      return;
    }

    const parsed = Math.max(0, Math.min(4, Number(value) || 0));
    setBuildingForm((prev) => {
      if (parsed === 0) {
        return { ...prev, blockCount: 0, blocks: [] };
      }

      const nextBlocks = prev.blocks.slice(0, parsed);
      while (nextBlocks.length < parsed) {
        nextBlocks.push(buildingRowTemplate(nextBlocks.length));
      }
      return { ...prev, blockCount: parsed, blocks: nextBlocks };
    });
  };

  const handleBuildingSubmit = async (event) => {
    event.preventDefault();
    if (!validateBuildingForm()) return;

    try {
      setBuildingSaving(true);
      const payload = {
        buildingName: buildingForm.buildingName.trim(),
        blockCount: Number(buildingForm.blockCount),
        blocks: buildingForm.blocks.map((block) => ({
          blockName: block.blockName.trim().toUpperCase(),
          floorCount: Number(block.floorCount),
        })),
      };

      if (editingBuildingId) {
        await updateBuilding(editingBuildingId, payload);
        showToast('success', 'Building updated', 'The building details were saved successfully.');
      } else {
        await createBuilding(payload);
        showToast('success', 'Building created', 'The new building was added successfully.');
      }

      setBuildingModalOpen(false);
      setEditingBuildingId(null);
      setBuildingForm(emptyBuildingForm());
      await loadBuildings();
      await loadResources(resourceFilters);
    } catch (submitError) {
      const message = submitError.response?.data?.message || 'Failed to save building';
      showToast('error', 'Building save failed', message);
      setError(message);
    } finally {
      setBuildingSaving(false);
    }
  };

  const handleResourceSubmit = async (event) => {
    event.preventDefault();
    if (!validateResourceForm()) return;

    try {
      setResourceSaving(true);
      const payload = {
        resourceType: resourceForm.resourceType,
        buildingId: resourceForm.buildingId,
        blockName: resourceForm.blockName,
        floorNumber: Number(resourceForm.floorNumber),
        hallNumber: Number(resourceForm.hallNumber),
        capacity: Number(resourceForm.capacity),
        status: resourceForm.status,
        description: resourceForm.description,
        latitude: resourceForm.resourceType === 'STUDY_AREA' ? Number(resourceForm.latitude) : null,
        longitude: resourceForm.resourceType === 'STUDY_AREA' ? Number(resourceForm.longitude) : null,
        mapRadiusMeters: resourceForm.resourceType === 'STUDY_AREA' ? Number(resourceForm.mapRadiusMeters) : null,
        projectorCount: Number(resourceForm.projectorCount) || 0,
        cameraCount: Number(resourceForm.cameraCount) || 0,
        pcCount: Number(resourceForm.pcCount) || 0,
      };

      if (editingResourceId) {
        await updateResource(editingResourceId, payload);
        showToast('success', 'Resource updated', 'The resource details were saved successfully.');
      } else {
        await createResource(payload);
        showToast('success', 'Resource created', 'The new resource was added successfully.');
      }

      setResourceModalOpen(false);
      setEditingResourceId(null);
      setResourceForm(emptyResourceForm());
      await loadResources(resourceFilters);
      await loadStudyAreas();
    } catch (submitError) {
      const message = submitError.response?.data?.message || 'Failed to save resource';
      showToast('error', 'Resource save failed', message);
      setError(message);
    } finally {
      setResourceSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('error', 'Location unavailable', 'This browser does not support geolocation. Use map click or manual latitude/longitude entry.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        setResourceForm((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        setResourceErrors((prev) => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));

        setLocating(false);
        showToast('success', 'Location detected', 'Latitude and longitude were filled using your current location.');
      },
      (geoError) => {
        let message = 'Unable to detect your location. Use map click or manual latitude/longitude entry.';

        if (geoError?.code === 1) {
          message = 'Location permission denied. Allow browser location access and try again.';
        } else if (geoError?.code === 2) {
          message = 'Location position unavailable. Please try again in a moment.';
        } else if (geoError?.code === 3) {
          message = 'Location request timed out. Please try again.';
        }

        setLocating(false);
        showToast('error', 'Location failed', message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  const handleDeleteBuilding = async () => {
    if (!confirmDelete?.id) return;

    try {
      await deleteBuilding(confirmDelete.id);
      showToast('success', 'Building deleted', 'The building was removed successfully.');
      await loadBuildings();
      await loadResources(resourceFilters);
    } catch (deleteError) {
      const message = deleteError.response?.data?.message || 'Unable to delete building';
      showToast('error', 'Delete failed', message);
    } finally {
      closeModals();
    }
  };

  const handleDeleteResource = async () => {
    if (!confirmDelete?.id) return;

    try {
      await deleteResource(confirmDelete.id);
      showToast('success', 'Resource deleted', 'The resource was removed successfully.');
      await loadResources(resourceFilters);
      await loadStudyAreas();
    } catch (deleteError) {
      const message = deleteError.response?.data?.message || 'Unable to delete resource';
      showToast('error', 'Delete failed', message);
    } finally {
      closeModals();
    }
  };

  const generateHallName = (blockName, floorNumber, hallNumber) => {
    const prefix = (blockName || '').trim().toUpperCase();
    if (!prefix) return '';
    return `${prefix}${String(Number(floorNumber) || 0).padStart(2, '0')}${String(Number(hallNumber) || 0).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#F8FAFC_45%,_#EEF2FF_100%)] text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex min-h-screen">
        <Sidebar onLogout={() => { logout(); navigate('/staff/login', { replace: true }); }} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            onLogout={() => { logout(); navigate('/staff/login', { replace: true }); }}
            user={user}
            isNotificationOpen={isNotificationOpen}
            setIsNotificationOpen={setIsNotificationOpen}
          />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Resources Catalogue</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Manage buildings, halls, and study areas from one place. Keep locations accurate and maintain resource availability across campus.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Buildings</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{stats.buildingCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Resources</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{stats.resourceCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Available</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{stats.availableCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-blue-100">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Maintenance</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{stats.maintenanceCount}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-3xl bg-blue-700 p-5 text-white shadow-xl shadow-blue-200">
                    <p className="text-sm font-medium text-blue-100">Live status</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-2xl font-black">{stats.availableCount}</p>
                        <p className="text-blue-100/90">Available</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black">{stats.maintenanceCount}</p>
                        <p className="text-blue-100/90">Maintenance</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Resources</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{stats.resourceCount}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Active</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{stats.availableCount}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Maintenance</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{stats.maintenanceCount}</p>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
              <div className="flex flex-wrap gap-2 border-b border-slate-100 p-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('buildings')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'buildings' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50'}`}
                >
                  Buildings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('resources')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'resources' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50'}`}
                >
                  Resources
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('study-areas')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'study-areas' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50'}`}
                >
                  Study Areas
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'buildings' ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Buildings Management</h2>
                        <p className="mt-1 text-sm text-slate-500">Create, edit, view, and remove campus buildings.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBuildingModal()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                      >
                        <Plus className="h-4 w-4" />
                        Add Building
                      </button>
                    </div>

                    {loadingBuildings ? (
                      <div className="py-20 text-center text-slate-500">Loading buildings...</div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-slate-900">Building Name</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Number of Blocks</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Blocks Summary</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {buildings.map((building) => (
                              <tr key={building.id} className="align-top">
                                <td className="px-4 py-4 font-semibold text-slate-800">{building.buildingName}</td>
                                <td className="px-4 py-4 text-slate-600">{building.blockCount}</td>
                                <td className="px-4 py-4 text-slate-600">
                                  {building.blocks?.map((block) => `${block.blockName} (${block.floorCount} floors)`).join(', ') || '-'}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDetailItem({ type: 'building', item: building })}
                                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openBuildingModal(building)}
                                      className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDelete({ type: 'building', id: building.id, name: building.buildingName })}
                                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {buildings.length === 0 && (
                              <tr>
                                <td className="px-4 py-16 text-center text-slate-500" colSpan="4">
                                  No buildings have been added yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'resources' ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Resources Catalogue</h2>
                        <p className="mt-1 text-sm text-slate-500">Create and manage bookable resources, then search and filter by type, capacity, and location.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openResourceModal()}
                        disabled={buildings.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Plus className="h-4 w-4" />
                        Add Resource
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search Resources</span>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={resourceFilters.search}
                            onChange={(event) => setResourceFilters((prev) => ({ ...prev, search: event.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                            placeholder="Search name, building, block, or description"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resource Type</span>
                        <select
                          value={resourceFilters.resourceType}
                          onChange={(event) => setResourceFilters((prev) => ({ ...prev, resourceType: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">All Types</option>
                          {RESOURCE_TYPES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Building</span>
                        <select
                          value={resourceFilters.buildingId}
                          onChange={(event) => setResourceFilters((prev) => ({ ...prev, buildingId: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">All Buildings</option>
                          {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                              {building.buildingName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</span>
                        <input
                          value={resourceFilters.location}
                          onChange={(event) => setResourceFilters((prev) => ({ ...prev, location: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Building, block, or room"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Min Capacity</span>
                        <input
                          type="number"
                          min="1"
                          value={resourceFilters.capacityMin}
                          onChange={(event) => setResourceFilters((prev) => ({ ...prev, capacityMin: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Any"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
                        <select
                          value={resourceFilters.status}
                          onChange={(event) => setResourceFilters((prev) => ({ ...prev, status: event.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">All Statuses</option>
                          {RESOURCE_STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {loadingResources ? (
                      <div className="py-20 text-center text-slate-500">Loading resources...</div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-slate-900">Resource Name</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Resource Type</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Building</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Block</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Floor</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Hall Number</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Capacity</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Equipment</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                              <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {visibleResources.map((resource) => (
                              <tr key={resource.id} className="align-top">
                                <td className="px-4 py-4 font-semibold text-slate-800">{resource.hallName}</td>
                                <td className="px-4 py-4 text-slate-600">{resourceTypeLabelMap[resource.resourceType] || resource.resourceType}</td>
                                <td className="px-4 py-4 text-slate-600">{resource.buildingName}</td>
                                <td className="px-4 py-4 text-slate-600">{resource.blockName}</td>
                                <td className="px-4 py-4 text-slate-600">{resource.floorNumber}</td>
                                <td className="px-4 py-4 text-slate-600">{resource.hallNumber}</td>
                                <td className="px-4 py-4 text-slate-600">{resource.capacity}</td>
                                <td className="px-4 py-4 text-slate-600">
                                  {resource.resourceType === 'STUDY_AREA'
                                    ? '-'
                                    : `Projectors: ${resource.projectorCount || 0}, Cameras: ${resource.cameraCount || 0}, PCs: ${resource.pcCount || 0}`}
                                </td>
                                <td className="px-4 py-4">
                                  <Badge value={resource.status} />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDetailItem({ type: 'resource', item: resource })}
                                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openResourceModal(resource)}
                                      className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDelete({ type: 'resource', id: resource.id, name: resource.hallName })}
                                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {visibleResources.length === 0 && (
                              <tr>
                                <td className="px-4 py-16 text-center text-slate-500" colSpan="10">
                                  No resources found for the current filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Study Areas</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('resources');
                          openResourceModal();
                          setResourceForm((prev) => ({ ...prev, resourceType: 'STUDY_AREA' }));
                        }}
                        disabled={buildings.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <Plus className="h-4 w-4" />
                        Add Study Area
                      </button>
                    </div>

                    {loadingStudyAreas ? (
                      <div className="py-20 text-center text-slate-500">Loading study areas...</div>
                    ) : listedStudyAreas.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-slate-500">
                        No study areas available yet. Add a `STUDY_AREA` resource to get started.
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {listedStudyAreas.map((area) => {
                            const radius = Number(area.mapRadiusMeters) || 50;
                            const activeCount = studyAreaOccupancy[area.id] || 0;
                            const activeMembers = studyAreaActiveMembers[area.id] || [];
                            const occupancyState = getOccupancyState(activeCount, area.capacity);
                            const hasCoordinates = Number.isFinite(Number(area.latitude)) && Number.isFinite(Number(area.longitude));
                            const normalizedCapacity = Number(area.capacity) || 0;
                            const occupancyPercent = normalizedCapacity > 0
                              ? Math.round((Number(activeCount) / normalizedCapacity) * 100)
                              : 0;
                            const occupancyWidth = Math.max(0, Math.min(occupancyPercent, 100));
                            const occupancyBarClass = occupancyPercent < 50
                              ? 'bg-emerald-500'
                              : occupancyPercent <= 90
                                ? 'bg-amber-500'
                                : 'bg-rose-500';

                            return (
                              <article key={area.id} className={`rounded-2xl border p-4 shadow-sm ${occupancyState.cardClass}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="inline-flex items-center gap-2 text-base font-bold text-slate-900">
                                    <MapPin className="h-4 w-4 text-blue-700" />
                                    {area.hallName}
                                  </h3>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                    {radius} m
                                    </span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${occupancyState.badgeClass}`}>
                                      {occupancyState.label}
                                    </span>
                                  </div>
                                </div>

                                <p className="mt-2 text-sm text-slate-600">Building: {area.buildingName || '-'}</p>
                                <p className="mt-1 text-sm text-slate-600">Capacity: {area.capacity || 0}</p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                                    <Users className="h-3.5 w-3.5" />
                                    {activeCount} active
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {activeMembers.length} member(s)
                                  </span>
                                </div>

                                <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
                                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                                    <span>Occupancy</span>
                                    <span>{occupancyPercent}%</span>
                                  </div>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
                                    <div className={`h-full rounded-full ${occupancyBarClass}`} style={{ width: `${occupancyWidth}%` }} />
                                  </div>
                                </div>

                                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                  <p>
                                    <span className="font-semibold">Latitude:</span> {hasCoordinates ? Number(area.latitude).toFixed(6) : '-'}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Longitude:</span> {hasCoordinates ? Number(area.longitude).toFixed(6) : '-'}
                                  </p>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      {buildingModalOpen && (
        <ModalShell
          title={editingBuildingId ? 'Edit Building' : 'Add Building'}
          subtitle="Define block rows and floor counts for each building."
          onClose={() => setBuildingModalOpen(false)}
          footer={
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setBuildingModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleBuildingSubmit} disabled={buildingSaving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300">
                {buildingSaving ? 'Saving...' : 'Save Building'}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Building Name</span>
              <input
                value={buildingForm.buildingName}
                onChange={(event) => setBuildingForm((prev) => ({ ...prev, buildingName: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                placeholder="Main Building"
              />
              {buildingErrors.buildingName && <p className="mt-1 text-xs font-medium text-red-600">{buildingErrors.buildingName}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Block Count</span>
              <input
                type="number"
                min="0"
                max="4"
                value={buildingForm.blockCount}
                onChange={(event) => handleBuildingCountChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleBuildingCountChange(event.currentTarget.value);
                    if (Number(event.currentTarget.value) > 0) {
                      focusBlockName(0);
                    }
                  }
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                aria-describedby="block-count-helper"
              />
              <p id="block-count-helper" className="mt-1 text-xs text-slate-500">
                Enter 0 to clear all block rows. Max 4 blocks allowed.
              </p>
              {buildingErrors.blockCount && <p className="mt-1 text-xs font-medium text-red-600">{buildingErrors.blockCount}</p>}
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Block Rows</span>
                <span className="text-xs text-slate-500">Must match block count</span>
              </div>

              <div className="space-y-3">
                {buildingForm.blocks.map((block, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Block Name</span>
                      <input
                        ref={(element) => { blockNameRefs.current[index] = element; }}
                        value={block.blockName}
                        maxLength={1}
                        onChange={(event) => {
                          const value = event.target.value.toUpperCase();
                          setBuildingForm((prev) => {
                            const blocks = [...prev.blocks];
                            blocks[index] = { ...blocks[index], blockName: value };
                            return { ...prev, blocks };
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            focusFloorCount(index);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="A"
                      />
                      {buildingErrors.blocks?.[index]?.blockName && (
                        <p className="mt-1 text-xs font-medium text-red-600">{buildingErrors.blocks[index].blockName}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Floor Count</span>
                      <input
                        ref={(element) => { floorCountRefs.current[index] = element; }}
                        type="number"
                        min="1"
                        max="18"
                        value={block.floorCount}
                        onChange={(event) => {
                          const value = event.target.value;
                          setBuildingForm((prev) => {
                            const blocks = [...prev.blocks];
                            blocks[index] = { ...blocks[index], floorCount: value };
                            return { ...prev, blocks };
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            if (index < buildingForm.blocks.length - 1) {
                              focusBlockName(index + 1);
                            } else {
                              handleBuildingSubmit(event);
                            }
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="3"
                      />
                      {buildingErrors.blocks?.[index]?.floorCount && (
                        <p className="mt-1 text-xs font-medium text-red-600">{buildingErrors.blocks[index].floorCount}</p>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {resourceModalOpen && (
        <ModalShell
          title={editingResourceId ? 'Edit Resource' : 'Add Resource'}
          subtitle="Hall name is generated automatically from block, floor, and hall number. Add projector, camera, and PC counts for hall resources."
          onClose={() => setResourceModalOpen(false)}
          footer={
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setResourceModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleResourceSubmit} disabled={resourceSaving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300">
                {resourceSaving ? 'Saving...' : 'Save Resource'}
              </button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Resource Type</span>
              <select
                value={resourceForm.resourceType}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setResourceForm((prev) => ({
                    ...prev,
                    resourceType: nextType,
                    latitude: nextType === 'STUDY_AREA' ? prev.latitude : '',
                    longitude: nextType === 'STUDY_AREA' ? prev.longitude : '',
                    mapRadiusMeters: nextType === 'STUDY_AREA' ? (prev.mapRadiusMeters || 50) : 50,
                    projectorCount: nextType === 'STUDY_AREA' ? 0 : prev.projectorCount,
                    cameraCount: nextType === 'STUDY_AREA' ? 0 : prev.cameraCount,
                    pcCount: nextType === 'STUDY_AREA' ? 0 : prev.pcCount,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                {RESOURCE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              {resourceErrors.resourceType && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.resourceType}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Building</span>
              <select
                value={resourceForm.buildingId}
                onChange={(event) => {
                  const buildingId = event.target.value;
                  const selected = buildings.find((item) => item.id === buildingId);
                  const firstBlock = selected?.blocks?.[0];
                  setResourceForm((prev) => ({
                    ...prev,
                    buildingId,
                    blockName: firstBlock?.blockName || '',
                    floorNumber: 1,
                    hallName: firstBlock?.blockName ? generateHallName(firstBlock.blockName, 1, prev.hallNumber) : '',
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select building</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>{building.buildingName}</option>
                ))}
              </select>
              {resourceErrors.buildingId && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.buildingId}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Block</span>
              <select
                value={resourceForm.blockName}
                disabled={!selectedBuilding}
                onChange={(event) => {
                  const blockName = event.target.value;
                  setResourceForm((prev) => ({
                    ...prev,
                    blockName,
                    floorNumber: 1,
                    hallName: generateHallName(blockName, 1, prev.hallNumber),
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              >
                <option value="">Select block</option>
                {selectedBuilding?.blocks?.map((block) => (
                  <option key={block.blockName} value={block.blockName}>{block.blockName}</option>
                ))}
              </select>
              {resourceErrors.blockName && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.blockName}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Floor</span>
              <select
                value={resourceForm.floorNumber}
                disabled={!selectedBlock}
                onChange={(event) => {
                  const floorNumber = Number(event.target.value);
                  setResourceForm((prev) => ({
                    ...prev,
                    floorNumber,
                    hallName: generateHallName(prev.blockName, floorNumber, prev.hallNumber),
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              >
                {!selectedBlock ? (
                  <option value="">Select block first</option>
                ) : (
                  Array.from({ length: selectedBlock.floorCount }, (_, index) => index + 1).map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))
                )}
              </select>
              {resourceErrors.floorNumber && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.floorNumber}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Hall Number</span>
              <input
                type="number"
                min="1"
                max="99"
                value={resourceForm.hallNumber}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, hallNumber: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              {resourceErrors.hallNumber && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.hallNumber}</p>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Hall Name</span>
              <input
                value={resourceForm.hallName}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Capacity</span>
              <input
                type="number"
                min="1"
                value={resourceForm.capacity}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, capacity: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
              {resourceErrors.capacity && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.capacity}</p>}
            </label>

            {resourceForm.resourceType !== 'STUDY_AREA' && (
              <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="text-sm font-semibold text-slate-900">Equipment in Hall</p>
                <p className="mt-1 text-xs text-slate-500">Enter counts for equipment available in this hall.</p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Projectors</span>
                    <input
                      type="number"
                      min="0"
                      value={resourceForm.projectorCount}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, projectorCount: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    {resourceErrors.projectorCount && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.projectorCount}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cameras</span>
                    <input
                      type="number"
                      min="0"
                      value={resourceForm.cameraCount}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, cameraCount: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    {resourceErrors.cameraCount && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.cameraCount}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PCs</span>
                    <input
                      type="number"
                      min="0"
                      value={resourceForm.pcCount}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, pcCount: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    {resourceErrors.pcCount && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.pcCount}</p>}
                  </label>
                </div>
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Status</span>
              <select
                value={resourceForm.status}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                {RESOURCE_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
              <textarea
                rows="4"
                value={resourceForm.description}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                placeholder="Optional description"
              />
            </label>

            {resourceForm.resourceType === 'STUDY_AREA' && (
              <div className="md:col-span-2 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Study Area Location</p>
                    <p className="text-xs text-slate-500">Use current location, type coordinates, or click the map.</p>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {locating ? 'Detecting...' : 'Use Current Location'}
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      value={resourceForm.latitude}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, latitude: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="6.9068"
                    />
                    {resourceErrors.latitude && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.latitude}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      value={resourceForm.longitude}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, longitude: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="79.8703"
                    />
                    {resourceErrors.longitude && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.longitude}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Radius (m)</span>
                    <input
                      type="number"
                      min="1"
                      value={resourceForm.mapRadiusMeters}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, mapRadiusMeters: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      placeholder="50"
                    />
                    {resourceErrors.mapRadiusMeters && <p className="mt-1 text-xs font-medium text-red-600">{resourceErrors.mapRadiusMeters}</p>}
                  </label>
                </div>

                <StudyAreaLocationPicker
                  latitude={resourceForm.latitude}
                  longitude={resourceForm.longitude}
                  radius={resourceForm.mapRadiusMeters}
                  onPick={(lat, lng) => {
                    setResourceForm((prev) => ({
                      ...prev,
                      latitude: Number(lat.toFixed(6)),
                      longitude: Number(lng.toFixed(6)),
                    }));
                  }}
                />
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {detailItem && detailItem.type === 'building' && (
        <ModalShell title="Building Details" subtitle="Review building blocks and floor counts." onClose={() => setDetailItem(null)}>
          <div className="space-y-4 text-sm text-slate-600">
            <div><span className="font-semibold text-slate-900">Name:</span> {detailItem.item.buildingName}</div>
            <div><span className="font-semibold text-slate-900">Block Count:</span> {detailItem.item.blockCount}</div>
            <div>
              <span className="font-semibold text-slate-900">Blocks:</span>
              <div className="mt-2 space-y-2">
                {detailItem.item.blocks?.map((block) => (
                  <div key={block.blockName} className="rounded-xl bg-slate-50 px-3 py-2">
                    {block.blockName} - {block.floorCount} floors
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {detailItem && detailItem.type === 'resource' && (
        <ModalShell title="Resource Details" subtitle="Review hall and assignment details." onClose={() => setDetailItem(null)}>
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div><span className="font-semibold text-slate-900">Hall Name:</span> {detailItem.item.hallName}</div>
            <div><span className="font-semibold text-slate-900">Type:</span> {detailItem.item.resourceType}</div>
            <div><span className="font-semibold text-slate-900">Building:</span> {detailItem.item.buildingName}</div>
            <div><span className="font-semibold text-slate-900">Block:</span> {detailItem.item.blockName}</div>
            <div><span className="font-semibold text-slate-900">Floor:</span> {detailItem.item.floorNumber}</div>
            <div><span className="font-semibold text-slate-900">Hall Number:</span> {detailItem.item.hallNumber}</div>
            <div><span className="font-semibold text-slate-900">Capacity:</span> {detailItem.item.capacity}</div>
            <div><span className="font-semibold text-slate-900">Status:</span> {detailItem.item.status}</div>
            <div className="md:col-span-2"><span className="font-semibold text-slate-900">Description:</span> {detailItem.item.description || '-'}</div>
            {detailItem.item.resourceType === 'STUDY_AREA' && (
              <>
                <div><span className="font-semibold text-slate-900">Latitude:</span> {detailItem.item.latitude ?? '-'}</div>
                <div><span className="font-semibold text-slate-900">Longitude:</span> {detailItem.item.longitude ?? '-'}</div>
                <div><span className="font-semibold text-slate-900">Radius:</span> {detailItem.item.mapRadiusMeters ?? '-'} m</div>
              </>
            )}
          </div>
        </ModalShell>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'building' ? 'Delete Building' : 'Delete Resource'}
          message={
            confirmDelete.type === 'building'
              ? `Are you sure you want to delete building "${confirmDelete.name}"? This action cannot be undone.`
              : `Are you sure you want to delete resource "${confirmDelete.name}"? This action cannot be undone.`
          }
          onConfirm={confirmDelete.type === 'building' ? handleDeleteBuilding : handleDeleteResource}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminResourcesPage;

