import { THEME } from "@tonconnect/ui";

const manifestUrl = "https://swap.coffee/tonconnect-manifest.json";

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
