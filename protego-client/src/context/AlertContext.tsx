import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Info, X } from 'lucide-react-native';
import { useAppTheme } from './ThemeContext';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertRequest = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
};

type AlertContextValue = { alert: (title: string, message?: string, buttons?: AppAlertButton[]) => void };

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  const [queue, setQueue] = useState<AlertRequest[]>([]);
  const current = queue[0];

  const alert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setQueue((previous) => [...previous, { title, message, buttons }]);
  }, []);

  const close = (button?: AppAlertButton) => {
    setQueue((previous) => previous.slice(1));
    button?.onPress?.();
  };

  const buttons = current?.buttons?.length ? current.buttons : [{ text: 'OK' }];
  const value = useMemo(() => ({ alert }), [alert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal visible={!!current} transparent animationType="fade" statusBarTranslucent onRequestClose={() => close()}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: theme.isDark ? '#000' : '#fff' }]}>
            <View style={styles.header}>
              <View style={[styles.infoIcon, { backgroundColor: theme.isDark ? '#fff' : '#000' }]}>
                <Info size={20} color={theme.isDark ? '#000' : '#fff'} strokeWidth={2.4} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>{current?.title}</Text>
              <TouchableOpacity onPress={() => close()} style={styles.closeButton} accessibilityLabel="Close alert" accessibilityRole="button">
                <X size={23} color={theme.isDark ? '#fff' : '#000'} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {!!current?.message && <Text style={[styles.message, { color: theme.isDark ? '#fff' : '#111' }]}>{current.message}</Text>}

            <View style={styles.actions}>
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => close(button)}
                  style={({ pressed }) => [
                    styles.action,
                    button.style === 'cancel' ? styles.cancelAction : { backgroundColor: theme.isDark ? '#fff' : '#000' },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.actionText, { color: button.style === 'cancel' ? theme.colors.text : theme.isDark ? '#000' : '#fff' }]}>{button.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAppAlert must be used within AlertProvider');
  return context;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5, 4, 18, 0.62)', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, lineHeight: 27, fontWeight: '700' },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 18, lineHeight: 25, marginTop: 14, marginLeft: 44 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24, marginLeft: 44 },
  action: { minWidth: 112, minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  cancelAction: { backgroundColor: 'transparent' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
