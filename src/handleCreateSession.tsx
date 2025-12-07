import { createSession } from "./api/remitxSession";
 
export default async function handleCreateSession() {
    try {
        const result = await createSession({
            userLoginId: "YOUR_DEVICE_ID_OR_USER_ID",
            deviceOs: "Web",        // Android or "iOS", "Web", etc.
            appVersion: "1.0.0",
        });

        console.log("process_id:", result.processId);
        // You can now store result.processId in context, Redux, etc.
    } catch (err) {
        console.error("Error creating session:", err);
    }
}
