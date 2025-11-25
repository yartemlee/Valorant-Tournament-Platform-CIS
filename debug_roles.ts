import { valorantApi } from "./src/services/valorantApi";

async function debugRoles() {
    console.log("Fetching agents...");
    const agents = await valorantApi.getAgents();

    const roles = new Set();
    agents.forEach(a => {
        if (a.role) {
            roles.add(a.role.displayName);
        }
    });

    console.log("Found roles:", Array.from(roles));
}

debugRoles();
