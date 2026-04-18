type ViewportCluster =
  | "ios-phone"
  | "ios-tablet"
  | "android-phone"
  | "android-tablet";

type ExportSize = {
  width: number;
  height: number;
};

type StarterTokens = {
  textColor: string;
  backgroundColor: string;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  bezelTopDistance: number;
  textTopDistance: number;
  deviceSizeFactor: number;
  borderRadius: number;
};

type CameraGeometry = {
  mode: "single" | "double";
  widthRatio: number;
  heightRatio: number;
  offsetTopRatio: number;
  color: string;
  ringColor: string;
  ringWidth: number;
  gapRatio?: number;
  fillBridgeEnabled?: boolean;
  defaultOffsetY?: number;
};

type ViewportBlueprint = {
  cluster: ViewportCluster;
  label: string;
  marketingSize: string;
  exportSize: ExportSize;
  flexibleSource: boolean;
  portraitOnlySource: boolean;
  starter: StarterTokens;
  camera?: CameraGeometry;
};

export const VIEWPORT_CATALOG = {
  iphone16pro: {
    cluster: "ios-phone",
    label: "iPhone 16 Pro",
    marketingSize: '6.3"',
    exportSize: { width: 1206, height: 2622 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 493,
      textTopDistance: 234,
      deviceSizeFactor: 1.1,
      borderRadius: 50,
    },
    camera: {
      mode: "double",
      widthRatio: 0.068,
      heightRatio: 0.034,
      offsetTopRatio: 0.023,
      gapRatio: 0.095,
      fillBridgeEnabled: true,
      defaultOffsetY: 16,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.12)",
      ringWidth: 1,
    },
  },
  customIphone: {
    cluster: "ios-phone",
    label: "Ozel iPhone",
    marketingSize: "Serbest",
    exportSize: { width: 1206, height: 2622 },
    flexibleSource: true,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#f7f1e8",
      bezelWidth: 16,
      bezelColor: "#11181C",
      fontFamily: "Outfit, sans-serif",
      fontSize: 92,
      fontWeight: "600",
      bezelTopDistance: 420,
      textTopDistance: 212,
      deviceSizeFactor: 1,
      borderRadius: 46,
    },
    camera: {
      mode: "double",
      widthRatio: 0.068,
      heightRatio: 0.034,
      offsetTopRatio: 0.023,
      gapRatio: 0.095,
      fillBridgeEnabled: true,
      defaultOffsetY: 16,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.12)",
      ringWidth: 1,
    },
  },
  ipadPro: {
    cluster: "ios-tablet",
    label: "iPad Pro 13 inc",
    marketingSize: '13"',
    exportSize: { width: 2064, height: 2752 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 25,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 467,
      textTopDistance: 250,
      deviceSizeFactor: 1.1,
      borderRadius: 40,
    },
  },
  androidPlayPhone: {
    cluster: "android-phone",
    label: "Android Genel",
    marketingSize: "9:16",
    exportSize: { width: 1080, height: 1920 },
    flexibleSource: true,
    portraitOnlySource: true,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 310,
      textTopDistance: 170,
      deviceSizeFactor: 1,
      borderRadius: 40,
    },
    camera: {
      mode: "single",
      widthRatio: 0.032,
      heightRatio: 0.032,
      offsetTopRatio: 0.028,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidGalaxyS24: {
    cluster: "android-phone",
    label: "Samsung Galaxy S24",
    marketingSize: '6.2"',
    exportSize: { width: 1080, height: 2340 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 96,
      fontWeight: "500",
      bezelTopDistance: 360,
      textTopDistance: 190,
      deviceSizeFactor: 0.95,
      borderRadius: 40,
    },
    camera: {
      mode: "single",
      widthRatio: 0.032,
      heightRatio: 0.032,
      offsetTopRatio: 0.028,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidPixel9Pro: {
    cluster: "android-phone",
    label: "Google Pixel 9 Pro",
    marketingSize: '6.8"',
    exportSize: { width: 1344, height: 2992 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 110,
      fontWeight: "500",
      bezelTopDistance: 455,
      textTopDistance: 230,
      deviceSizeFactor: 0.9,
      borderRadius: 48,
    },
    camera: {
      mode: "single",
      widthRatio: 0.032,
      heightRatio: 0.032,
      offsetTopRatio: 0.028,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidOnePlus12: {
    cluster: "android-phone",
    label: "OnePlus 12",
    marketingSize: '6.8"',
    exportSize: { width: 1440, height: 3168 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 110,
      fontWeight: "500",
      bezelTopDistance: 470,
      textTopDistance: 236,
      deviceSizeFactor: 0.9,
      borderRadius: 44,
    },
    camera: {
      mode: "single",
      widthRatio: 0.031,
      heightRatio: 0.031,
      offsetTopRatio: 0.027,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidXiaomi14: {
    cluster: "android-phone",
    label: "Xiaomi 14",
    marketingSize: '6.4"',
    exportSize: { width: 1200, height: 2670 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 18,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 102,
      fontWeight: "500",
      bezelTopDistance: 380,
      textTopDistance: 196,
      deviceSizeFactor: 0.94,
      borderRadius: 40,
    },
    camera: {
      mode: "single",
      widthRatio: 0.031,
      heightRatio: 0.031,
      offsetTopRatio: 0.027,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidNothingPhone2: {
    cluster: "android-phone",
    label: "Nothing Phone 2",
    marketingSize: '6.7"',
    exportSize: { width: 1080, height: 2412 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 18,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 358,
      textTopDistance: 184,
      deviceSizeFactor: 0.96,
      borderRadius: 40,
    },
    camera: {
      mode: "single",
      widthRatio: 0.03,
      heightRatio: 0.03,
      offsetTopRatio: 0.026,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidXperia1VI: {
    cluster: "android-phone",
    label: "Sony Xperia 1 VI",
    marketingSize: '6.5"',
    exportSize: { width: 1080, height: 2340 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 18,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 96,
      fontWeight: "500",
      bezelTopDistance: 350,
      textTopDistance: 178,
      deviceSizeFactor: 0.98,
      borderRadius: 34,
    },
    camera: {
      mode: "single",
      widthRatio: 0.03,
      heightRatio: 0.03,
      offsetTopRatio: 0.026,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidVivoX100: {
    cluster: "android-phone",
    label: "Vivo X100",
    marketingSize: '6.8"',
    exportSize: { width: 1260, height: 2800 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 104,
      fontWeight: "500",
      bezelTopDistance: 420,
      textTopDistance: 214,
      deviceSizeFactor: 0.92,
      borderRadius: 44,
    },
    camera: {
      mode: "single",
      widthRatio: 0.031,
      heightRatio: 0.031,
      offsetTopRatio: 0.027,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  customAndroid: {
    cluster: "android-phone",
    label: "Ozel Android",
    marketingSize: "Serbest",
    exportSize: { width: 1080, height: 1920 },
    flexibleSource: true,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#f7f1e8",
      bezelWidth: 14,
      bezelColor: "#11181C",
      fontFamily: "Outfit, sans-serif",
      fontSize: 86,
      fontWeight: "600",
      bezelTopDistance: 300,
      textTopDistance: 150,
      deviceSizeFactor: 1,
      borderRadius: 34,
    },
    camera: {
      mode: "single",
      widthRatio: 0.032,
      heightRatio: 0.032,
      offsetTopRatio: 0.028,
      color: "#05070b",
      ringColor: "rgba(255,255,255,0.18)",
      ringWidth: 1.5,
    },
  },
  androidTablet7: {
    cluster: "android-tablet",
    label: "Nexus 7",
    marketingSize: '7"',
    exportSize: { width: 1200, height: 1920 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 421,
      textTopDistance: 206,
      deviceSizeFactor: 1.2,
      borderRadius: 50,
    },
  },
  androidTablet10: {
    cluster: "android-tablet",
    label: "Pixel Tablet",
    marketingSize: '10"',
    exportSize: { width: 1600, height: 2560 },
    flexibleSource: false,
    portraitOnlySource: false,
    starter: {
      textColor: "#11181C",
      backgroundColor: "#dcf7fd",
      bezelWidth: 20,
      bezelColor: "#11181C",
      fontFamily: "Fredoka, sans-serif",
      fontSize: 100,
      fontWeight: "500",
      bezelTopDistance: 493,
      textTopDistance: 234,
      deviceSizeFactor: 1.1,
      borderRadius: 50,
    },
  },
} as const satisfies Record<string, ViewportBlueprint>;

export type RenderViewportId = keyof typeof VIEWPORT_CATALOG;

type ViewportMap<T> = {
  [Key in RenderViewportId]: T;
};

const catalogEntries = Object.entries(VIEWPORT_CATALOG) as [
  RenderViewportId,
  (typeof VIEWPORT_CATALOG)[RenderViewportId],
][];

const projectCatalog = <T>(
  projector: (blueprint: (typeof VIEWPORT_CATALOG)[RenderViewportId]) => T
) =>
  Object.fromEntries(
    catalogEntries.map(([viewportId, blueprint]) => [
      viewportId,
      projector(blueprint),
    ])
  ) as ViewportMap<T>;

const collectClusterLabels = (cluster: ViewportCluster) =>
  Object.fromEntries(
    catalogEntries.flatMap(([viewportId, blueprint]) =>
      blueprint.cluster === cluster ? [[viewportId, blueprint.label]] : []
    )
  ) as Partial<ViewportMap<string>>;

export const VIEWPORT_EXPORT_DIMENSIONS = projectCatalog(
  (blueprint) => blueprint.exportSize
);

export const CANVAS_COORDINATE_SYSTEMS = VIEWPORT_EXPORT_DIMENSIONS;

export const APPLE_HANDSET_OPTIONS = collectClusterLabels("ios-phone");
export const APPLE_TABLET_OPTIONS = collectClusterLabels("ios-tablet");
export const ANDROID_HANDSET_OPTIONS = collectClusterLabels("android-phone");
export const ANDROID_TABLET_OPTIONS = collectClusterLabels("android-tablet");

export const VIEWPORT_LABELS = projectCatalog((blueprint) => blueprint.label);
export const VIEWPORT_MARKETING_SIZES = projectCatalog(
  (blueprint) => blueprint.marketingSize
);
export const VIEWPORT_STARTER_TOKENS = projectCatalog(
  (blueprint) => blueprint.starter
);

export const VIEWPORT_CAMERA_GEOMETRY = Object.fromEntries(
  catalogEntries.flatMap(([viewportId, blueprint]) =>
    "camera" in blueprint ? [[viewportId, blueprint.camera]] : []
  )
) as Partial<
  ViewportMap<CameraGeometry>
>;

export const CAMERA_TUNING_DEFAULTS = {
  sizeAdjustment: 6,
  offsetX: 0,
  offsetY: -8,
  gap: 0,
  bridgeEnabled: false,
} as const;
