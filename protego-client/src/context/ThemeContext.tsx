import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated, StyleSheet, View, Easing, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

export type AppThemeMode = 'light' | 'dark';

type AppTheme = {
  mode: AppThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    header: [string, string, string];
    surface: string;
    card: string;
    row: string;
    input: string;
    inputFocused: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    border: string;
    tabBar: string;
    toggleSurface: string;
    accent: string;
  };
};

type ThemeContextType = {
  theme: AppTheme;
  mode: AppThemeMode;
  toggleTheme: (originX?: number, originY?: number) => void;
  setThemeMode: (mode: AppThemeMode) => void;
};

const lightTheme: AppTheme = {
  mode: 'light',
  isDark: false,
  colors: {
    background: '#F5F5F5',
    header: ['#F8F8FF', '#FFFFFF', '#F3F0FF'],
    surface: '#FFFFFF',
    card: '#FFFFFF',
    row: '#FFFFFF',
    input: '#F7F7F7',
    inputFocused: '#F3F0FF',
    text: '#111111',
    textMuted: '#777777',
    textSubtle: '#AAAAAA',
    border: '#E8E8E8',
    tabBar: '#FFFFFF',
    toggleSurface: '#FFFFFF',
    accent: '#7C3AED',
  },
};

const darkTheme: AppTheme = {
  mode: 'dark',
  isDark: true,
  colors: {
    background: '#000000',
    header: ['#000000', '#0A0A0A', '#0F0F0F'],
    surface: '#111111',
    card: '#171717',
    row: '#1F1F1F',
    input: '#1A1A1A',
    inputFocused: '#211733',
    text: '#FFFFFF',
    textMuted: '#A8A8A8',
    textSubtle: 'rgba(255,255,255,0.45)',
    border: '#2A2A2A',
    tabBar: '#1A1A1A',
    toggleSurface: '#1F1F1F',
    accent: '#A78BFA',
  },
};

const STORAGE_KEY = 'appThemeMode';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Diagonal of screen = max ripple radius needed to cover entire screen
const MAX_RADIUS = Math.sqrt(SCREEN_W ** 2 + SCREEN_H ** 2);

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>('dark');
  const isAnimatingRef = useRef(false);

  // Ripple state
  const [rippleVisible, setRippleVisible] = useState(false);
  const [rippleOrigin, setRippleOrigin] = useState({ x: SCREEN_W - 40, y: 60 });
  const [rippleColor, setRippleColor] = useState('#000000'); // incoming theme bg color

  const rippleScale = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const setThemeMode = async (nextMode: AppThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  };

  const toggleTheme = useCallback(
    (originX?: number, originY?: number) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const nextMode = mode === 'dark' ? 'light' : 'dark';
      const nextTheme = nextMode === 'dark' ? darkTheme : lightTheme;

      // Ripple originates from toggle button position (or top-right corner fallback)
      const ox = originX ?? SCREEN_W - 40;
      const oy = originY ?? 60;

      // The ripple circle needs to cover the whole screen from origin
      // scaleTo makes the circle (initially radius 1) expand to MAX_RADIUS
      const scaleTo = MAX_RADIUS;

      setRippleOrigin({ x: ox, y: oy });
      setRippleColor(nextTheme.colors.background);
      rippleScale.setValue(0);
      rippleOpacity.setValue(1);
      blurOpacity.setValue(0);
      setRippleVisible(true);

      Animated.parallel([
        // Ripple expands across the screen
        Animated.timing(rippleScale, {
          toValue: scaleTo,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Subtle blur peaks at midpoint then fades
        Animated.sequence([
          Animated.timing(blurOpacity, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(blurOpacity, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Switch theme once ripple covers screen
        setThemeMode(nextMode).then(() => {
          // Fade out ripple so it doesn't snap-disappear
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }).start(() => {
            setRippleVisible(false);
            rippleScale.setValue(0);
            rippleOpacity.setValue(1);
            isAnimatingRef.current = false;
          });
        });
      });
    },
    [mode]
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      toggleTheme,
      setThemeMode,
    }),
    [mode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: value.theme.colors.background }}>
        {children}

        {/* Ripple overlay — sits above everything */}
        {rippleVisible && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 99998 },
            ]}
            pointerEvents="none"
          >
            {/* Ripple circle */}
            <Animated.View
              style={{
                position: 'absolute',
                // Center the circle on the origin point
                left: rippleOrigin.x - 1,
                top: rippleOrigin.y - 1,
                width: 2,
                height: 2,
                borderRadius: 1,
                backgroundColor: rippleColor,
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              }}
            />

            {/* Blur shimmer on top of ripple */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}
            >
              <BlurView
                intensity={60}
                tint={mode === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}