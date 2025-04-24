export class Api {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async getLatestTransactions(initData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/user/latest?${initData}`);
            if (!response.ok) throw new Error(`Failed to fetch latest transactions: ${response.statusText}`);
            return (await response.json()).items;
        } catch (error) {
            console.error("Failed to get latest transactions:", error);
            return [];
        }
    }

    async requestProof() {
        try {
            const response = await fetch(`${this.baseUrl}/api/proof/request-quote`);
            if (!response.ok) throw new Error(`Failed to request proof: ${response.statusText}`);
            return (await response.json()).proof;
        } catch (error) {
            console.error("Failed to request proof:", error);
            throw error;
        }
    }

    async linkUser(initData, proof) {
        try {
            const response = await fetch(`${this.baseUrl}/api/user/link?${initData}`, {
                method: "POST",
                body: JSON.stringify({}),
                headers: {
                    "Content-Type": "application/json",
                    "proof": proof,
                },
            });
            if (!response.ok) throw new Error(`Failed to link user: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to link user:", error);
            throw error;
        }
    }

    async saveRoute(initData, routeId, proof) {
        try {
            const response = await fetch(`${this.baseUrl}/api/user/routes?${initData}`, {
                method: "POST",
                body: JSON.stringify({route_id: routeId}),
                headers: {
                    "Content-Type": "application/json",
                    "proof": proof,
                },
            });
            if (!response.ok) throw new Error(`Failed to save route: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to save route:", error);
            throw error;
        }
    }
}