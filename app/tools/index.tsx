import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  Search,
  Download,
  ExternalLink,
  Eye,
  Grid,
  List as ListIcon,
  X,
  Plus,
  Filter,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react-native';

import { Colors } from '../../src/constants/theme';
import { Header } from '../../src/components/common/Header';
import { toolsApi, MOCK_TOOLS } from '../../src/api/tools.api';
import { ToolItem, ToolCategoryStat } from '../../src/types';

export const TOOL_CATEGORIES = [
  { name: "2D CAD Drafting", platforms: ["Windows", "Mac", "Web"] },
  { name: "3D CAD Modeling", platforms: ["Windows", "Mac", "Web", "Linux"] },
  { name: "Parametric CAD", platforms: ["Windows", "Mac"] },
  { name: "Direct Modeling CAD", platforms: ["Windows", "Mac"] },
  { name: "BIM Authoring", platforms: ["Windows", "Mac"] },
  { name: "BIM Coordination & Clash Detection", platforms: ["Windows", "Web"] },
  { name: "BIM Collaboration & Common Data Environment (CDE)", platforms: ["Web", "Windows", "Mac", "iOS", "Android"] },
  { name: "4D/5D BIM Simulation", platforms: ["Windows", "Web"] },
  { name: "Finite Element Analysis (FEA) – Linear", platforms: ["Windows", "Linux"] },
  { name: "Nonlinear FEA", platforms: ["Windows", "Linux"] },
  { name: "Computational Fluid Dynamics (CFD)", platforms: ["Windows", "Linux", "Web"] },
  { name: "Multiphysics Simulation", platforms: ["Windows", "Linux"] },
  { name: "Thermal Analysis", platforms: ["Windows", "Linux", "Web"] },
  { name: "Explicit Dynamics (Impact/Explosion)", platforms: ["Windows", "Linux"] },
  { name: "Fatigue & Durability Analysis", platforms: ["Windows", "Linux"] },
  { name: "Composite Materials Analysis", platforms: ["Windows", "Linux"] },
  { name: "Topology Optimization", platforms: ["Windows", "Mac", "Web"] },
  { name: "Generative Design", platforms: ["Windows", "Mac", "Web"] },
  { name: "Electronic Circuit Design (Schematic Capture)", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "PCB Layout & Routing", platforms: ["Windows", "Mac", "Linux"] },
  { name: "Circuit Simulation (SPICE)", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "FPGA Design", platforms: ["Windows", "Linux"] },
  { name: "Embedded Systems IDE", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "RF & Microwave Design", platforms: ["Windows", "Linux"] },
  { name: "Antenna Design & Simulation", platforms: ["Windows", "Linux"] },
  { name: "Signal Integrity Analysis", platforms: ["Windows", "Linux"] },
  { name: "Power Electronics Design", platforms: ["Windows", "Web"] },
  { name: "Control System Design & Tuning", platforms: ["Windows", "Mac", "Web"] },
  { name: "PLC Programming (IEC 61131-3)", platforms: ["Windows"] },
  { name: "SCADA Configuration", platforms: ["Windows", "Web", "iOS", "Android"] },
  { name: "HMI Development", platforms: ["Windows", "Web"] },
  { name: "Industrial Robot Programming & Simulation", platforms: ["Windows", "Web"] },
  { name: "CNC Programming (G-code)", platforms: ["Windows", "Mac", "Web"] },
  { name: "CAM (Computer-Aided Manufacturing)", platforms: ["Windows", "Mac"] },
  { name: "Additive Manufacturing / Slicing Software", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "CMM Inspection Programming", platforms: ["Windows"] },
  { name: "Reverse Engineering (Mesh-to-CAD)", platforms: ["Windows", "Mac"] },
  { name: "3D Scanning Data Processing", platforms: ["Windows", "Mac", "Linux"] },
  { name: "Geographic Information System (GIS)", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "Remote Sensing & Satellite Image Analysis", platforms: ["Windows", "Linux", "Web"] },
  { name: "Surveying & Total Station Data Processing", platforms: ["Windows", "iOS", "Android"] },
  { name: "Drone Mapping & Photogrammetry", platforms: ["Windows", "Mac", "Web"] },
  { name: "Structural Analysis (Frame/Truss)", platforms: ["Windows", "Web"] },
  { name: "Structural Dynamics & Seismic Analysis", platforms: ["Windows", "Web"] },
  { name: "Steel Connection Design", platforms: ["Windows", "Web"] },
  { name: "Concrete Design & Detailing", platforms: ["Windows", "Web"] },
  { name: "Timber Engineering Design", platforms: ["Windows", "Web"] },
  { name: "Geotechnical Slope Stability", platforms: ["Windows"] },
  { name: "Foundation Design", platforms: ["Windows"] },
  { name: "Tunneling & Underground Structure Analysis", platforms: ["Windows"] },
  { name: "Soil-Structure Interaction", platforms: ["Windows", "Linux"] },
  { name: "Hydraulic Modeling (Pipes/Channels)", platforms: ["Windows", "Web"] },
  { name: "Stormwater & Drainage Design", platforms: ["Windows", "Web"] },
  { name: "Water Distribution Network Analysis", platforms: ["Windows", "Web"] },
  { name: "Wastewater Treatment Process Simulation", platforms: ["Windows"] },
  { name: "River & Floodplain Modeling", platforms: ["Windows", "Web"] },
  { name: "Coastal Engineering & Wave Modeling", platforms: ["Windows", "Linux"] },
  { name: "HVAC Load Calculation", platforms: ["Windows", "Web"] },
  { name: "Duct & Pipe Sizing (HVAC)", platforms: ["Windows", "Web"] },
  { name: "Building Energy Simulation", platforms: ["Windows", "Mac", "Web"] },
  { name: "Building Thermal & Moisture Analysis", platforms: ["Windows"] },
  { name: "Lighting Design (Indoor/Outdoor)", platforms: ["Windows", "Web"] },
  { name: "Daylighting Analysis", platforms: ["Windows", "Web"] },
  { name: "Fire & Smoke Simulation (CFD)", platforms: ["Windows", "Linux"] },
  { name: "Egress Modeling (Pedestrian Evacuation)", platforms: ["Windows"] },
  { name: "Acoustic & Noise Mapping", platforms: ["Windows", "Web", "Linux"] },
  { name: "Room Acoustics Simulation", platforms: ["Windows", "Mac"] },
  { name: "Environmental Impact Assessment (EIA) Tools", platforms: ["Web", "Windows"] },
  { name: "Air Dispersion Modeling (Pollutants)", platforms: ["Windows", "Linux"] },
  { name: "Groundwater Flow & Contaminant Transport", platforms: ["Windows", "Linux"] },
  { name: "Noise at Work Assessment", platforms: ["Web", "Windows"] },
  { name: "Chemical Process Simulation (Steady State)", platforms: ["Windows", "Linux"] },
  { name: "Dynamic Process Simulation", platforms: ["Windows", "Linux"] },
  { name: "Process Hazard Analysis (HAZOP/HAZID)", platforms: ["Windows", "Web"] },
  { name: "Layer of Protection Analysis (LOPA)", platforms: ["Windows", "Web"] },
  { name: "Quantitative Risk Assessment (QRA)", platforms: ["Windows"] },
  { name: "Consequence Modeling (Fire/Explosion/Toxic)", platforms: ["Windows", "Web"] },
  { name: "Reliability, Availability & Maintainability (RAM)", platforms: ["Windows", "Web"] },
  { name: "Failure Mode & Effects Analysis (FMEA)", platforms: ["Windows", "Web", "iOS", "Android"] },
  { name: "Fault Tree Analysis (FTA)", platforms: ["Windows", "Web"] },
  { name: "Bowtie Risk Analysis", platforms: ["Web", "Windows"] },
  { name: "Job Safety Analysis (JSA) / Task Risk Assessment", platforms: ["Web", "iOS", "Android"] },
  { name: "Safety Observation & Incident Reporting", platforms: ["Web", "iOS", "Android"] },
  { name: "Permit to Work (PTW) Systems", platforms: ["Web", "iOS", "Android"] },
  { name: "Lockout/Tagout (LOTO) Procedure Management", platforms: ["Web", "iOS", "Android"] },
  { name: "Process Safety Management (PSM) Dashboard", platforms: ["Web", "Windows"] },
  { name: "Functional Safety (SIL) Calculation", platforms: ["Windows", "Web"] },
  { name: "Industrial Hygiene & Exposure Monitoring", platforms: ["Windows", "iOS", "Android"] },
  { name: "Ergonomics Analysis & Simulation", platforms: ["Windows", "Web"] },
  { name: "Machine Guarding Risk Assessment", platforms: ["Windows", "Web"] },
  { name: "Construction Site Safety Management", platforms: ["Web", "iOS", "Android"] },
  { name: "Fall Protection & Rescue Planning", platforms: ["Web", "iOS", "Android"] },
  { name: "Fire Alarm & Detection System Design", platforms: ["Windows"] },
  { name: "Sprinkler & Suppression System Design", platforms: ["Windows", "Web"] },
  { name: "Fire Hydrant & Water Supply Analysis", platforms: ["Windows", "Web"] },
  { name: "Structural Fire Engineering", platforms: ["Windows", "Linux"] },
  { name: "Architectural Site Analysis & Sun Path", platforms: ["Windows", "Mac", "Web"] },
  { name: "Architectural Massing & Conceptual Design", platforms: ["Windows", "Mac", "Web"] },
  { name: "Interior Design & Space Planning", platforms: ["Windows", "Mac", "Web"] },
  { name: "Landscape Architecture & Planting Design", platforms: ["Windows", "Mac", "Web"] },
  { name: "Urban Planning & Zoning Analysis", platforms: ["Web", "Windows", "Mac"] },
  { name: "Parking Lot & Traffic Circulation Design", platforms: ["Windows", "Web"] },
  { name: "Road & Highway Geometric Design", platforms: ["Windows", "Web"] },
  { name: "Intersection & Traffic Signal Design", platforms: ["Windows", "Web"] },
  { name: "Public Transport Simulation (Bus/Rail)", platforms: ["Windows"] },
  { name: "Microsimulation (Vehicle/Pedestrian)", platforms: ["Windows", "Web"] },
  { name: "Rail Track & Alignment Design", platforms: ["Windows"] },
  { name: "Aerospace Structural Analysis (FEM)", platforms: ["Windows", "Linux"] },
  { name: "Aircraft Aerodynamics (CFD)", platforms: ["Windows", "Linux"] },
  { name: "Propulsion System Simulation (Turbofan/Rocket)", platforms: ["Windows", "Linux"] },
  { name: "Avionics & Flight Control Design", platforms: ["Windows", "Linux"] },
  { name: "Flight Dynamics & Stability Analysis", platforms: ["Windows", "Linux"] },
  { name: "Helicopter Rotor Dynamics", platforms: ["Windows", "Linux"] },
  { name: "Spacecraft Orbital Mechanics", platforms: ["Windows", "Mac", "Web"] },
  { name: "Satellite Thermal & Radiation Analysis", platforms: ["Windows", "Linux"] },
  { name: "Marine Hydrostatics & Stability", platforms: ["Windows"] },
  { name: "Ship Hull Form Design", platforms: ["Windows", "Mac"] },
  { name: "Marine CFD (Resistance & Seakeeping)", platforms: ["Windows", "Linux"] },
  { name: "Offshore Platform Structural Analysis", platforms: ["Windows", "Linux"] },
  { name: "Subsea Pipeline Design & Stress Analysis", platforms: ["Windows"] },
  { name: "Petroleum Reservoir Simulation", platforms: ["Windows", "Linux"] },
  { name: "Wellbore Hydraulics & Drilling Simulation", platforms: ["Windows"] },
  { name: "Production Logging & Well Test Analysis", platforms: ["Windows"] },
  { name: "Pipeline Hydraulics (Oil/Gas)", platforms: ["Windows", "Web"] },
  { name: "Refinery Process Simulation (Crude unit)", platforms: ["Windows", "Linux"] },
  { name: "Biomedical Device Design (CAD)", platforms: ["Windows", "Mac"] },
  { name: "Biomechanics Simulation (FEA)", platforms: ["Windows", "Linux"] },
  { name: "Computational Biofluid Dynamics (Blood flow)", platforms: ["Windows", "Linux"] },
  { name: "Medical Image Processing (DICOM to CAD)", platforms: ["Windows", "Mac", "Linux"] },
  { name: "Surgical Planning & Simulation", platforms: ["Windows", "Mac"] },
  { name: "Pharmaceutical Process Simulation", platforms: ["Windows", "Linux"] },
  { name: "Mining Exploration & Geological Modeling", platforms: ["Windows", "Linux"] },
  { name: "Mine Planning & Scheduling", platforms: ["Windows"] },
  { name: "Blast Design & Fragmentation Analysis", platforms: ["Windows"] },
  { name: "Mineral Processing Simulation", platforms: ["Windows"] },
  { name: "Metallurgical Thermodynamics & Phase Diagrams", platforms: ["Windows", "Web"] },
  { name: "Material Selection & Database", platforms: ["Web", "Windows", "Mac"] },
  { name: "Corrosion Prediction & Modeling", platforms: ["Windows", "Web"] },
  { name: "Polymer Processing Simulation (Injection Molding)", platforms: ["Windows", "Linux"] },
  { name: "Metal Forming (Forging/Extrusion) Simulation", platforms: ["Windows", "Linux"] },
  { name: "Casting Simulation (Sand/Die)", platforms: ["Windows", "Linux"] },
  { name: "Heat Treatment & Phase Transformation Modeling", platforms: ["Windows", "Linux"] },
  { name: "Welding Simulation & Residual Stress", platforms: ["Windows", "Linux"] },
  { name: "Quality Control & Statistical Process Control (SPC)", platforms: ["Windows", "Web", "iOS", "Android"] },
  { name: "Measurement System Analysis (MSA/Gage R&R)", platforms: ["Windows", "Web"] },
  { name: "Design of Experiments (DOE) Software", platforms: ["Windows", "Web"] },
  { name: "Root Cause Analysis (RCA) Tools", platforms: ["Web", "Windows", "iOS", "Android"] },
  { name: "Lean Manufacturing & Value Stream Mapping", platforms: ["Web", "Windows"] },
  { name: "Six Sigma (DMAIC) Project Management", platforms: ["Web", "Windows", "iOS", "Android"] },
  { name: "Overall Equipment Effectiveness (OEE) Tracking", platforms: ["Web", "iOS", "Android"] },
  { name: "Asset Management & CMMS", platforms: ["Web", "Windows", "iOS", "Android"] },
  { name: "Maintenance Scheduling & Work Order", platforms: ["Web", "iOS", "Android"] },
  { name: "Predictive Maintenance (Vibration Analysis)", platforms: ["Windows", "iOS", "Android"] },
  { name: "Thermography Analysis (Infrared)", platforms: ["Windows", "iOS", "Android"] },
  { name: "Lubrication Management", platforms: ["Web", "iOS", "Android"] },
  { name: "Project Gantt & PERT Chart", platforms: ["Windows", "Mac", "Web", "iOS", "Android"] },
  { name: "Critical Path Method (CPM) Scheduling", platforms: ["Windows", "Web"] },
  { name: "Earned Value Management (EVM)", platforms: ["Windows", "Web"] },
  { name: "Resource Loading & Leveling", platforms: ["Windows", "Web"] },
  { name: "Construction Job Costing", platforms: ["Windows", "Web"] },
  { name: "Tendering & Bid Management", platforms: ["Web", "Windows"] },
  { name: "Contract Management (FIDIC/NEC)", platforms: ["Web", "Windows"] },
  { name: "Document Control & Version Management", platforms: ["Web", "Windows", "Mac", "iOS", "Android"] },
  { name: "Engineering Change Order (ECO) Workflow", platforms: ["Web", "Windows"] },
  { name: "Product Lifecycle Management (PLM)", platforms: ["Web", "Windows", "Mac"] },
  { name: "Requirements Management & Traceability", platforms: ["Web", "Windows"] },
  { name: "Technical Manual & Illustration (IETM)", platforms: ["Windows", "Web", "iOS", "Android"] },
  { name: "CAD Viewer & Markup (Lightweight)", platforms: ["Web", "Windows", "Mac", "iOS", "Android"] },
  { name: "PDF Markup & Measurement", platforms: ["Windows", "Mac", "Web", "iOS", "Android"] },
  { name: "Computational Geometry & Meshing", platforms: ["Windows", "Linux", "Web"] },
  { name: "Scientific Plotting & Curve Fitting", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "Statistical Analysis (JMP-like)", platforms: ["Windows", "Mac", "Web"] },
  { name: "Time Series Analysis (Signal Processing)", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "Optimization & Linear Programming", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "Symbolic Mathematics (CAS)", platforms: ["Windows", "Mac", "Linux", "Web"] },
  { name: "Unit Conversion & Engineering Calculator", platforms: ["Web", "iOS", "Android", "Windows", "Mac"] },
  { name: "Pipe Sizing & Pressure Drop", platforms: ["Web", "Windows", "iOS", "Android"] },
  { name: "Cable Sizing & Voltage Drop", platforms: ["Web", "Windows"] },
  { name: "Electrical Load Flow & Short Circuit", platforms: ["Windows", "Web"] },
  { name: "Protection Relay Coordination", platforms: ["Windows"] },
  { name: "Arc Flash Hazard Analysis", platforms: ["Windows", "Web"] },
  { name: "Earthing / Grounding Design", platforms: ["Windows"] },
  { name: "Lightning Protection Risk Assessment", platforms: ["Windows", "Web"] },
  { name: "Building Energy Code Compliance (EnergyPlus)", platforms: ["Windows", "Linux", "Web"] },
  { name: "LEED / Green Building Scorecard", platforms: ["Web", "iOS", "Android"] },
  { name: "Life Cycle Assessment (LCA) for Products", platforms: ["Windows", "Web"] },
  { name: "Carbon Footprint Calculation", platforms: ["Web", "Windows", "iOS", "Android"] },
  { name: "Hydrogen System Design (Electrolysis/Fuel Cell)", platforms: ["Windows", "Web"] },
  { name: "Battery Pack Thermal & Electrical Simulation", platforms: ["Windows", "Linux"] },
  { name: "Solar PV System Design", platforms: ["Windows", "Mac", "Web", "iOS", "Android"] },
  { name: "Wind Turbine Load & Performance Simulation", platforms: ["Windows", "Linux"] },
  { name: "Geothermal Heat Exchanger Design", platforms: ["Windows", "Web"] },
  { name: "Building Automation System (BAS) Logic Design", platforms: ["Windows"] },
  { name: "Network Simulation & Protocol Analysis (OPNET)", platforms: ["Windows", "Linux"] },
  { name: "Cybersecurity Risk Assessment (OT/ICS)", platforms: ["Web", "Windows"] },
  { name: "Data Historian & Trend Analysis (OSIsoft PI)", platforms: ["Windows", "Web", "iOS", "Android"] },
  { name: "Digital Twin Platform (IoT Integration)", platforms: ["Web", "Windows", "Linux"] },
  { name: "Augmented Reality for Maintenance", platforms: ["Windows", "iOS", "Android"] },
  { name: "Virtual Reality Safety Training", platforms: ["Windows", "Web"] },
  { name: "Collaborative Whiteboard for Engineers", platforms: ["Web", "Windows", "Mac", "iOS", "Android"] },
  { name: "Engineering Notebook (Cloud)", platforms: ["Web", "Windows", "Mac", "iOS", "Android"] },
  { name: "Reference Standard & Code Checker (ASME/ISO/ASTM)", platforms: ["Web", "Windows"] },
  { name: "Formula & Equation Database", platforms: ["Web", "iOS", "Android"] },
  { name: "Engineering Job Log & Timesheet", platforms: ["Web", "iOS", "Android"] },
  { name: "Professional Exam Prep (PE/FE) Quizzes", platforms: ["Web", "iOS", "Android"] }
];

export default function ToolsLibraryScreen() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [categories, setCategories] = useState<ToolCategoryStat[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All tools');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  // Dropdown Modals for Form Picker
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState<boolean>(false);
  const [showPlatformPickerModal, setShowPlatformPickerModal] = useState<boolean>(false);
  const [showLicensePickerModal, setShowLicensePickerModal] = useState<boolean>(false);

  // Form state for Add Tool
  const [newTool, setNewTool] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    version: '',
    platform: '',
    license: '',
    downloadLink: '',
    documentationLink: '',
    features: '',
    requirements: '',
    fileSize: '',
    rating: 0,
  });

  const [categorySearch, setCategorySearch] = useState<string>('');
  const [fileUploading, setFileUploading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchToolsData();
  }, [selectedCategory, searchQuery, currentPage]);

  const fetchInitialData = async () => {
    try {
      const statsRes = await toolsApi.getCategoryStats();
      const countMap = new Map<string, number>();
      if (statsRes && Array.isArray(statsRes)) {
        statsRes.forEach((s) => countMap.set(s.name, s.count));
      }

      const mergedCategories: ToolCategoryStat[] = [
        { name: 'All tools', count: countMap.get('All tools') || MOCK_TOOLS.length },
      ];

      TOOL_CATEGORIES.forEach((c) => {
        mergedCategories.push({
          name: c.name,
          count: countMap.get(c.name) || MOCK_TOOLS.filter(m => m.category === c.name).length,
        });
      });

      setCategories(mergedCategories);
    } catch (err) {
      console.error('Error fetching category stats:', err);
      const fallbackCategories: ToolCategoryStat[] = [
        { name: 'All tools', count: MOCK_TOOLS.length },
        ...TOOL_CATEGORIES.map((c) => ({
          name: c.name,
          count: MOCK_TOOLS.filter((m) => m.category === c.name).length,
        })),
      ];
      setCategories(fallbackCategories);
    }
  };

  const fetchToolsData = async () => {
    setLoading(true);
    try {
      const res = await toolsApi.getTools({
        category: selectedCategory,
        search: searchQuery,
        page: currentPage,
        limit: 12,
      });
      setTools(res.tools);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching tools:', err);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInitialData(), fetchToolsData()]);
    setRefreshing(false);
  };

  const handleCategorySelect = (categoryName: string) => {
    const catObj = TOOL_CATEGORIES.find((c) => c.name === categoryName);
    let updatedPlatform = newTool.platform;
    if (catObj && !catObj.platforms.includes(newTool.platform)) {
      updatedPlatform = catObj.platforms[0] || '';
    }
    setNewTool((prev) => ({
      ...prev,
      category: categoryName,
      platform: updatedPlatform,
    }));
    setShowCategoryPickerModal(false);
  };

  const handlePickOfflineFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const selectedFile = res.assets[0];
        setFileUploading(true);

        const formData = new FormData();
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
        } as any);

        const uploadRes = await toolsApi.uploadToolFile(formData);

        setNewTool((prev) => ({
          ...prev,
          downloadLink: uploadRes.url,
          fileSize: uploadRes.fileSize || (selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : prev.fileSize),
        }));
        setUploadedFileName(selectedFile.name);
        Alert.alert('File Uploaded', 'Offline tool file uploaded successfully!');
      }
    } catch (err) {
      console.error('Offline file upload error:', err);
      Alert.alert('Upload Error', 'Failed to upload offline file.');
    } finally {
      setFileUploading(false);
    }
  };

  const resetForm = () => {
    setNewTool({
      name: '',
      category: '',
      subcategory: '',
      description: '',
      version: '',
      platform: '',
      license: '',
      downloadLink: '',
      documentationLink: '',
      features: '',
      requirements: '',
      fileSize: '',
      rating: 0,
    });
    setCategorySearch('');
    setUploadedFileName('');
  };

  const handleAddToolSubmit = async () => {
    if (!newTool.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a tool name.');
      return;
    }
    if (!newTool.category) {
      Alert.alert('Validation Error', 'Please select a tool category.');
      return;
    }
    if (!newTool.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a tool description.');
      return;
    }

    setActionLoading(true);
    try {
      const featuresArr = newTool.features
        ? newTool.features.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      const requirementsArr = newTool.requirements
        ? newTool.requirements.split(',').map((r) => r.trim()).filter(Boolean)
        : [];

      await toolsApi.createTool({
        ...newTool,
        features: featuresArr,
        requirements: requirementsArr,
      });

      setShowAddModal(false);
      resetForm();
      fetchToolsData();
      fetchInitialData();
      Alert.alert('Success', 'Tool added successfully!');
    } catch (error: any) {
      console.error('Add tool error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add tool');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenLink = async (link?: string) => {
    if (!link) return;
    try {
      await Linking.openURL(link);
    } catch (err) {
      Alert.alert('Error', 'Unable to open link in browser.');
    }
  };

  const selectedCategoryObj = TOOL_CATEGORIES.find((c) => c.name === newTool.category);
  const availablePlatforms = selectedCategoryObj
    ? selectedCategoryObj.platforms
    : ['Windows', 'Mac', 'Linux', 'Web', 'Cross-platform'];

  const filteredCategoriesDropdown = TOOL_CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const totalToolCount = categories.find((c) => c.name === 'All tools')?.count || tools.length;

  const renderToolCard = ({ item }: { item: ToolItem }) => {
    const getLicenseBg = (license?: string) => {
      switch (license) {
        case 'Free':
        case 'Open Source':
          return '#DCFCE7';
        case 'Paid':
          return '#DBEAFE';
        case 'Freemium':
        case 'Trial':
          return '#FEF3C7';
        default:
          return '#F3F4F6';
      }
    };

    const getLicenseTextColor = (license?: string) => {
      switch (license) {
        case 'Free':
        case 'Open Source':
          return '#15803D';
        case 'Paid':
          return '#1D4ED8';
        case 'Freemium':
        case 'Trial':
          return '#B45309';
        default:
          return '#4B5563';
      }
    };

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listCard}
          activeOpacity={0.8}
          onPress={() => setSelectedTool(item)}
        >
          <View style={styles.listCardBody}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.toolName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.license ? (
                <View style={[styles.licenseBadge, { backgroundColor: getLicenseBg(item.license) }]}>
                  <Text style={[styles.licenseBadgeText, { color: getLicenseTextColor(item.license) }]}>
                    {item.license}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.toolDesc} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.listMetaRow}>
              <Text style={styles.metaText}>{item.category}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.platform || 'Cross-platform'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewDetailsBtnSmall}
            onPress={() => setSelectedTool(item)}
          >
            <Eye size={14} color="#2563EB" />
            <Text style={styles.viewDetailsBtnTextSmall}>Details</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.8}
        onPress={() => setSelectedTool(item)}
      >
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.toolName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.toolCatText} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
          {item.license ? (
            <View style={[styles.licenseBadge, { backgroundColor: getLicenseBg(item.license) }]}>
              <Text style={[styles.licenseBadgeText, { color: getLicenseTextColor(item.license) }]}>
                {item.license}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.toolDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.gridMetaRow}>
          <Text style={styles.platformText} numberOfLines={1}>
            {item.platform || 'Cross-platform'}
          </Text>
          {item.fileSize ? <Text style={styles.fileSizeBadge}>{item.fileSize}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => setSelectedTool(item)}
        >
          <Eye size={15} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Tools & Software Library" showBack />

      <FlatList
        data={tools}
        keyExtractor={(item) => item._id}
        renderItem={renderToolCard}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
        ListHeaderComponent={
          <View>
            {/* Top Page Header - Matching Web Screenshot 1:1 */}
            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mainTitle}>Tools & Software Library</Text>
                <Text style={styles.mainSubtitle}>
                  Engineering software, design tools, and calculators
                </Text>
              </View>
              <View style={styles.headerRightBox}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.addButtonText}>Add Tool</Text>
                </TouchableOpacity>
                <View style={styles.countBadgePill}>
                  <Text style={styles.countBadgePillText}>{totalToolCount} tools</Text>
                </View>
              </View>
            </View>

            {/* Search Bar & View Mode Toggle Controls */}
            <View style={styles.toolbarRow}>
              <View style={styles.searchBar}>
                <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tools, software, and calculators"
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={(txt) => {
                    setSearchQuery(txt);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.filterIconButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Filter size={18} color="#2563EB" />
                <ChevronDown size={14} color="#2563EB" style={{ marginLeft: 2 }} />
              </TouchableOpacity>

              <View style={styles.viewToggleGroup}>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid size={16} color={viewMode === 'grid' ? '#FFFFFF' : '#4B5563'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('list')}
                >
                  <ListIcon size={16} color={viewMode === 'list' ? '#FFFFFF' : '#4B5563'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizontal Categories Scroll Bar */}
            <View style={styles.categorySection}>
              <Text style={styles.sectionHeaderTitle}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.catPill,
                    selectedCategory === 'All tools' && styles.catPillActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory('All tools');
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      selectedCategory === 'All tools' && styles.catPillTextActive,
                    ]}
                  >
                    All tools
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      selectedCategory === 'All tools' && styles.countBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        selectedCategory === 'All tools' && styles.countBadgeTextActive,
                      ]}
                    >
                      {totalToolCount}
                    </Text>
                  </View>
                </TouchableOpacity>

                {categories
                  .filter((c) => c.name !== 'All tools')
                  .map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        style={[styles.catPill, isSelected && styles.catPillActive]}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setCurrentPage(1);
                        }}
                      >
                        <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                          {cat.name}
                        </Text>
                        <View style={[styles.countBadge, isSelected && styles.countBadgeActive]}>
                          <Text style={[styles.countBadgeText, isSelected && styles.countBadgeTextActive]}>
                            {cat.count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>

            {/* Tools Section Header */}
            <View style={styles.toolsSectionHeader}>
              <Text style={styles.toolsTitle}>Tools</Text>
              <Text style={styles.toolsCountSubtext}>
                {loading ? 'Loading...' : `Showing ${tools.length} of ${tools.length} tools`}
              </Text>
            </View>

            {loading && !refreshing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Fetching tools...</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Layers size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No tools found</Text>
              <Text style={styles.emptySub}>No tools found. Add one to get started!</Text>
            </View>
          ) : null
        }
      />

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity
            style={styles.categoryModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Filter by Category ({categories.length})</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <TouchableOpacity
                style={[
                  styles.catModalItem,
                  selectedCategory === 'All tools' && styles.catModalItemActive,
                ]}
                onPress={() => {
                  setSelectedCategory('All tools');
                  setCurrentPage(1);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.catModalItemText,
                    selectedCategory === 'All tools' && styles.catModalItemTextActive,
                  ]}
                >
                  All tools
                </Text>
                <Text style={styles.catModalCount}>
                  {categories.find((c) => c.name === 'All tools')?.count || 0}
                </Text>
              </TouchableOpacity>

              {categories
                .filter((c) => c.name !== 'All tools')
                .map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[styles.catModalItem, isSelected && styles.catModalItemActive]}
                      onPress={() => {
                        setSelectedCategory(cat.name);
                        setCurrentPage(1);
                        setShowCategoryModal(false);
                      }}
                    >
                      <Text style={[styles.catModalItemText, isSelected && styles.catModalItemTextActive]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.catModalCount}>{cat.count}</Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Tool Details Modal */}
      <Modal
        visible={!!selectedTool}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedTool(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setSelectedTool(null)}
        >
          {selectedTool ? (
            <TouchableOpacity
              style={styles.detailModalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {selectedTool.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedTool(null)}>
                  <X size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.detailScrollContent}>
                <Text style={styles.detailSectionTitle}>Description</Text>
                <Text style={styles.detailBodyText}>{selectedTool.description}</Text>

                {/* Specs Grid */}
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Version</Text>
                    <Text style={styles.specValue}>{selectedTool.version || 'N/A'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Platform</Text>
                    <Text style={styles.specValue}>{selectedTool.platform || 'Cross-platform'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>License</Text>
                    <Text style={styles.specValue}>{selectedTool.license || 'N/A'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>File Size</Text>
                    <Text style={styles.specValue}>{selectedTool.fileSize || 'N/A'}</Text>
                  </View>
                </View>

                {selectedTool.features && selectedTool.features.length > 0 ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.detailSectionTitle}>Key Features</Text>
                    {selectedTool.features.map((feat, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedTool.requirements && selectedTool.requirements.length > 0 ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.detailSectionTitle}>System Requirements</Text>
                    {selectedTool.requirements.map((req, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.detailActionRow}>
                  {selectedTool.downloadLink ? (
                    <TouchableOpacity
                      style={styles.downloadPrimaryBtn}
                      onPress={() => handleOpenLink(selectedTool.downloadLink)}
                    >
                      <Download size={16} color="#FFFFFF" />
                      <Text style={styles.downloadPrimaryBtnText}>Download Tool</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedTool.documentationLink ? (
                    <TouchableOpacity
                      style={styles.docSecondaryBtn}
                      onPress={() => handleOpenLink(selectedTool.documentationLink)}
                    >
                      <ExternalLink size={16} color="#374151" />
                      <Text style={styles.docSecondaryBtnText}>Documentation</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </ScrollView>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </Modal>

      {/* Add New Tool Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <TouchableOpacity
            style={styles.createModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Add New Tool</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.createFormScroll}>
              <Text style={styles.fieldLabel}>
                Tool Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g., AutoCAD"
                placeholderTextColor="#9CA3AF"
                value={newTool.name}
                onChangeText={(val) => setNewTool({ ...newTool, name: val })}
              />

              {/* Category Picker */}
              <Text style={styles.fieldLabel}>
                Category <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectDropdownBtn}
                onPress={() => setShowCategoryPickerModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectDropdownText,
                    !newTool.category && styles.selectDropdownPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {newTool.category || 'Select or search category...'}
                </Text>
                <ChevronDown size={18} color="#374151" />
              </TouchableOpacity>

              {/* Version & Platform Grid */}
              <View style={styles.dropdownRowGrid}>
                <View style={styles.dropdownCol}>
                  <Text style={styles.fieldLabel}>Version</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., 2026"
                    placeholderTextColor="#9CA3AF"
                    value={newTool.version}
                    onChangeText={(val) => setNewTool({ ...newTool, version: val })}
                  />
                </View>

                <View style={styles.dropdownCol}>
                  <Text style={styles.fieldLabel}>Platform</Text>
                  <TouchableOpacity
                    style={styles.selectDropdownBtn}
                    onPress={() => setShowPlatformPickerModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectDropdownText,
                        !newTool.platform && styles.selectDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {newTool.platform || 'Select platform'}
                    </Text>
                    <ChevronDown size={18} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* License & File Size */}
              <View style={styles.dropdownRowGrid}>
                <View style={styles.dropdownCol}>
                  <Text style={styles.fieldLabel}>License</Text>
                  <TouchableOpacity
                    style={styles.selectDropdownBtn}
                    onPress={() => setShowLicensePickerModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectDropdownText,
                        !newTool.license && styles.selectDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {newTool.license || 'Select license'}
                    </Text>
                    <ChevronDown size={18} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dropdownCol}>
                  <Text style={styles.fieldLabel}>File Size</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., 2.5 GB"
                    placeholderTextColor="#9CA3AF"
                    value={newTool.fileSize}
                    onChangeText={(val) => setNewTool({ ...newTool, fileSize: val })}
                  />
                </View>
              </View>

              {/* Description */}
              <Text style={styles.fieldLabel}>
                Description <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.fieldInput, styles.textAreaInput]}
                placeholder="Brief description of the tool..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={newTool.description}
                onChangeText={(val) => setNewTool({ ...newTool, description: val })}
              />

              {/* Features & Requirements */}
              <Text style={styles.fieldLabel}>Features (comma separated)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g., 3D modeling, Rendering, Animation"
                placeholderTextColor="#9CA3AF"
                value={newTool.features}
                onChangeText={(val) => setNewTool({ ...newTool, features: val })}
              />

              <Text style={styles.fieldLabel}>Requirements (comma separated)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g., Windows 11, 16GB RAM, Dedicated GPU"
                placeholderTextColor="#9CA3AF"
                value={newTool.requirements}
                onChangeText={(val) => setNewTool({ ...newTool, requirements: val })}
              />

              {/* Tool Source */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionHeading}>Tool Source (Link or Offline File)</Text>

              <Text style={styles.fieldLabel}>Download Link / URL</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                value={newTool.downloadLink}
                onChangeText={(val) => setNewTool({ ...newTool, downloadLink: val })}
              />

              <Text style={styles.fieldLabel}>Documentation Link</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                value={newTool.documentationLink}
                onChangeText={(val) => setNewTool({ ...newTool, documentationLink: val })}
              />

              {/* Upload offline file */}
              <Text style={styles.fieldLabel}>Upload Offline File</Text>
              <TouchableOpacity style={styles.fileUploadBox} onPress={handlePickOfflineFile}>
                <Plus size={20} color="#2563EB" />
                <Text style={styles.fileUploadText}>
                  {uploadedFileName ? `✓ ${uploadedFileName}` : 'Choose offline file (ZIP, EXE, RAR, PDF)'}
                </Text>
              </TouchableOpacity>
              {fileUploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.uploadingText}>Uploading file to server...</Text>
                </View>
              ) : null}

              {/* Submit Buttons */}
              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.submitActionBtn, actionLoading && styles.submitActionBtnDisabled]}
                  disabled={actionLoading}
                  onPress={handleAddToolSubmit}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>Add Tool</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelActionBtn}
                  disabled={actionLoading}
                  onPress={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelActionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* CATEGORY PICKER POPUP (Searchable 170+ TOOL_CATEGORIES) */}
      <Modal
        visible={showCategoryPickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCategoryPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowCategoryPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Tool Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Search 170+ categories..."
              placeholderTextColor="#9CA3AF"
              value={categorySearch}
              onChangeText={setCategorySearch}
            />

            <ScrollView style={{ maxHeight: 320 }}>
              {filteredCategoriesDropdown.map((cat) => {
                const isSelected = newTool.category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                    onPress={() => handleCategorySelect(cat.name)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.pickerItemSub}>
                        Platforms: {cat.platforms.join(', ')}
                      </Text>
                    </View>
                    {isSelected ? <Check size={18} color="#2563EB" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* PLATFORM PICKER POPUP */}
      <Modal
        visible={showPlatformPickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPlatformPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowPlatformPickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Platform</Text>
              <TouchableOpacity onPress={() => setShowPlatformPickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {availablePlatforms.map((plat) => {
              const isSelected = newTool.platform === plat;
              return (
                <TouchableOpacity
                  key={plat}
                  style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                  onPress={() => {
                    setNewTool({ ...newTool, platform: plat });
                    setShowPlatformPickerModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {plat}
                  </Text>
                  {isSelected ? <Check size={18} color="#2563EB" /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* LICENSE PICKER POPUP */}
      <Modal
        visible={showLicensePickerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLicensePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowLicensePickerModal(false)}
        >
          <TouchableOpacity
            style={styles.pickerModalBox}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select License</Text>
              <TouchableOpacity onPress={() => setShowLicensePickerModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {['Free', 'Open Source', 'Freemium', 'Paid', 'Trial'].map((lic) => {
              const isSelected = newTool.license === lic;
              return (
                <TouchableOpacity
                  key={lic}
                  style={[styles.pickerItemRow, isSelected && styles.pickerItemRowSelected]}
                  onPress={() => {
                    setNewTool({ ...newTool, license: lic });
                    setShowLicensePickerModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {lic}
                  </Text>
                  {isSelected ? <Check size={18} color="#2563EB" /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 14,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  headerRightBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  countBadgePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: '#2563EB',
  },
  categorySection: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  categoriesScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  catPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  catPillTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  countBadgeTextActive: {
    color: '#2563EB',
  },
  toolsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  toolsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  toolsCountSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  // Cards
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCardBody: {
    flex: 1,
    marginRight: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  toolCatText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  licenseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  licenseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toolDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  fileSizeBadge: {
    fontSize: 11,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    borderRadius: 8,
  },
  viewDetailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewDetailsBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailsBtnTextSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  createModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: '92%',
  },
  detailModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  catModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  catModalItemActive: {
    backgroundColor: '#EFF6FF',
  },
  catModalItemText: {
    fontSize: 14,
    color: '#374151',
  },
  catModalItemTextActive: {
    fontWeight: '700',
    color: '#2563EB',
  },
  catModalCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Detail Modal Content
  detailScrollContent: {
    paddingBottom: 10,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  detailBodyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 14,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 12,
    marginBottom: 10,
  },
  specBox: {
    width: '45%',
  },
  specLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 6,
  },
  bulletText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  downloadPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  downloadPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  docSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  docSecondaryBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },

  // Create Form styles
  createFormScroll: {
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: '#111827',
  },
  textAreaInput: {
    height: 80,
    paddingVertical: 10,
  },
  dropdownRowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dropdownCol: {
    flex: 1,
  },
  selectDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  selectDropdownText: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  selectDropdownPlaceholder: {
    color: '#6B7280',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  fileUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginTop: 6,
  },
  fileUploadText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
    flex: 1,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  uploadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  submitActionBtn: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitActionBtnDisabled: {
    opacity: 0.6,
  },
  submitActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelActionBtn: {
    flex: 0.8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },

  // Picker Modal styles
  pickerModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pickerSearchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#111827',
    marginBottom: 10,
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerItemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerItemTextSelected: {
    fontWeight: '700',
    color: '#2563EB',
  },
  pickerItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
