/**
 * EAS Build Integration
 * Handles building mobile apps using Expo Application Services
 */

export interface BuildConfig {
  projectId: string;
  platform: 'ios' | 'android' | 'all';
  profile: 'development' | 'preview' | 'production';
}

export interface BuildResult {
  success: boolean;
  buildId?: string;
  buildUrl?: string;
  error?: string;
}

export interface BuildStatus {
  id: string;
  status: 'in-queue' | 'in-progress' | 'finished' | 'errored' | 'canceled';
  platform: 'ios' | 'android';
  artifacts?: {
    buildUrl?: string;
    applicationArchiveUrl?: string;
  };
  error?: {
    message: string;
  };
}

/**
 * Generate EAS configuration file
 */
export function generateEasConfig(projectName: string): string {
  const config = {
    cli: {
      version: '>= 12.0.0',
    },
    build: {
      development: {
        developmentClient: true,
        distribution: 'internal',
        ios: {
          simulator: true,
        },
      },
      preview: {
        distribution: 'internal',
      },
      production: {
        autoIncrement: true,
      },
    },
    submit: {
      production: {},
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate app.json with EAS project ID
 */
export function generateAppConfig(
  projectName: string,
  easProjectId?: string
): Record<string, unknown> {
  const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return {
    expo: {
      name: projectName,
      slug,
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      scheme: slug,
      userInterfaceStyle: 'dark',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#0a0a0a',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.rork.${slug}`,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#0a0a0a',
        },
        package: `com.rork.${slug}`,
      },
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/favicon.png',
      },
      plugins: ['expo-router'],
      experiments: {
        typedRoutes: true,
      },
      extra: {
        eas: easProjectId ? { projectId: easProjectId } : undefined,
      },
    },
  };
}

/**
 * Instructions for EAS Build setup
 */
export const EAS_BUILD_INSTRUCTIONS = `
# EAS Build Setup Instructions

## Prerequisites
1. Install EAS CLI: \`npm install -g eas-cli\`
2. Login to Expo: \`eas login\`
3. Configure your project: \`eas build:configure\`

## Build Commands

### Development Build (for testing)
\`\`\`bash
eas build --profile development --platform ios
eas build --profile development --platform android
\`\`\`

### Preview Build (internal distribution)
\`\`\`bash
eas build --profile preview --platform all
\`\`\`

### Production Build (app store)
\`\`\`bash
eas build --profile production --platform ios
eas build --profile production --platform android
\`\`\`

## Submit to App Stores
\`\`\`bash
eas submit --platform ios
eas submit --platform android
\`\`\`

## Notes
- iOS builds require an Apple Developer account ($99/year)
- Android builds require a Google Play Developer account ($25 one-time)
- Development builds require a device or simulator
- Preview builds can be shared via QR code or link
`;

/**
 * Check if EAS is configured
 */
export function isEasConfigured(files: Record<string, string>): boolean {
  return 'eas.json' in files;
}

/**
 * Get build status message
 */
export function getBuildStatusMessage(status: BuildStatus['status']): string {
  switch (status) {
    case 'in-queue':
      return 'Build is queued and waiting to start...';
    case 'in-progress':
      return 'Build is in progress...';
    case 'finished':
      return 'Build completed successfully!';
    case 'errored':
      return 'Build failed. Check the logs for details.';
    case 'canceled':
      return 'Build was canceled.';
    default:
      return 'Unknown build status.';
  }
}
