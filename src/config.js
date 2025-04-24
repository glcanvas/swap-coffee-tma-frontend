import { THEME } from "@tonconnect/ui";

// TonConnect manifest URL
const manifestUrl = "https://swap.coffee/tonconnect-manifest.json";

// TonConnect configuration
export const tonConnectConfig = {
    /**
     * The URL of the TonConnect manifest file.
     * This manifest provides details about the TonConnect application and its settings.
     * This URL should point to a JSON file located in the public folder of your project.
     *
     * @type {string}
     */
    manifestUrl: manifestUrl,

    /**
     * User interface preferences for TonConnect.
     * This allows customization of the appearance of the TonConnect UI.
     *
     * @type {Object}
     * @property {string} theme - The theme of the TonConnect UI. Values include 'DARK' and 'LIGHT'.
     */
    uiPreferences: {
        theme: THEME.LIGHT
    },
};

// Swap Widget configuration
export const swapWidgetConfig = {
    /**
     * Theme setting for the Swap Widget.
     * Determines the visual style of the widget.
     *
     * @type {string}
     */
    theme: 'dark',

    /**
     * The connection method used for integrating the Swap Widget.
     * Defines how the widget interacts with the wallet for transactions.
     *
     * Options:
     * - 'tonConnect' (most common): Uses TonConnect for seamless wallet integration.
     * - 'payload': A custom method that bypasses TonConnect and requires manual payload configuration for wallet interactions.
     *
     * @type {string}
     */
    injectionMode: 'tonConnect',

    /**
     * Locale setting for the Swap Widget.
     * Defines the language and regional settings for the widget.
     *
     * @type {string}
     */
    locale: 'en',

    /**
     * Configuration for TonConnect manifest in the Swap Widget.
     * This setting tells the widget where to find the TonConnect manifest.
     *
     * @type {Object}
     * @property {string} url - The URL of the TonConnect manifest.
     */
    tonConnectManifest: {
        url: manifestUrl
    }
};