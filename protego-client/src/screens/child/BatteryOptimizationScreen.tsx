import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { getBatteryOptimizationInstructions } from '../../utils/deviceOemHelper';

export default function BatteryOptimizationScreen({ navigation }: any) {
    const { theme } = useAppTheme();
    const { brand, steps } = getBatteryOptimizationInstructions();

    const handleOpenSettings = () => {
        Linking.openSettings();
    };

    const handleSkip = () => {
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={theme.colors.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGrad}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="battery-charging-outline" size={26} color="#fff" />
                </View>
                <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>One more step</Text>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Keep tracking reliable{'\n'}even at low battery.
                </Text>
            </LinearGradient>

            <ScrollView
                style={[styles.card, { backgroundColor: theme.colors.card }]}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                    Your phone ({brand}) may pause location sharing to save battery. Follow these
                    steps so your family always knows you're safe:
                </Text>

                {steps.map((step, i) => (
                    <View key={i} style={[styles.stepRow, { backgroundColor: theme.colors.row, borderColor: theme.colors.border }]}>
                        <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.stepNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={[styles.stepText, { color: theme.colors.text }]}>{step}</Text>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.colors.textPrimary }]}
                    onPress={handleOpenSettings}
                    activeOpacity={0.85}
                >
                    <Ionicons name="settings-outline" size={16} color={theme.colors.background} />
                    <Text style={[styles.primaryBtnText, { color: theme.colors.background }]}>
                        Open App Settings
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={[styles.skipBtnText, { color: theme.colors.textMuted }]}>
                        I'll do this later
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGrad: { paddingHorizontal: 28, paddingTop: 90, paddingBottom: 50 },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(124,58,237,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    headerTitle: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.5 },
    card: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        paddingHorizontal: 24,
        paddingTop: 28,
    },
    subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 22 },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
    primaryBtn: {
        flexDirection: 'row',
        gap: 8,
        borderRadius: 100,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    primaryBtnText: { fontSize: 15, fontWeight: '500' },
    skipBtn: { alignItems: 'center', marginTop: 16, padding: 8 },
    skipBtnText: { fontSize: 13 },
});