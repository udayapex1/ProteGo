import * as Device from 'expo-device';

export type OemInstructions = {
    brand: string;
    steps: string[];
};

export const getBatteryOptimizationInstructions = (): OemInstructions => {
    const brand = (Device.brand || '').toLowerCase();

    if (brand.includes('xiaomi') || brand.includes('redmi') || brand.includes('poco')) {
        return {
            brand: 'Xiaomi / Redmi / POCO',
            steps: [
                'Open Settings → Apps → Manage apps → Protego',
                'Tap "Battery saver" → select "No restrictions"',
                'Go back, tap "Autostart" → enable it for Protego',
                'Also check Settings → Battery & performance → App battery saver → Protego → No restrictions',
            ],
        };
    }

    if (brand.includes('vivo')) {
        return {
            brand: 'Vivo',
            steps: [
                'Open Settings → Battery → Background power consumption management',
                'Find Protego and set it to "Allow"',
                'Also go to i Manager → App manager → Autostart manager → enable Protego',
            ],
        };
    }

    if (brand.includes('oppo') || brand.includes('realme') || brand.includes('oneplus')) {
        return {
            brand: 'Oppo / Realme / OnePlus',
            steps: [
                'Open Settings → Battery → Protego → set to "Don\'t restrict"',
                'Go to Settings → Apps → App management → Protego → Allow auto-launch',
                'Also check Battery → More battery settings → Sleep standby optimization → disable for Protego',
            ],
        };
    }

    if (brand.includes('samsung')) {
        return {
            brand: 'Samsung',
            steps: [
                'Open Settings → Apps → Protego → Battery',
                'Set "Background usage limits" to "Unrestricted"',
                'Make sure "Put app to sleep" is turned OFF for Protego',
            ],
        };
    }

    // Generic Android fallback
    return {
        brand: 'Android',
        steps: [
            'Open Settings → Apps → Protego → Battery',
            'Select "Unrestricted" or "Don\'t optimize"',
            'If available, also enable "Allow background activity"',
        ],
    };
};