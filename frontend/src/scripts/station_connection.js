export async function get_connection_host() {
    const LOCAL_HOST = "http://weatherstation.local:8000"
    const TUNNEL_HOST = "https://weatherapi.whatdoesthatdo.dev"

    async function test_connection(host) {
        try {
            const response = await fetch(host+"")
            console.log("Response from "+host+" is below.\n"+response.status)
            return true
        } catch (error) {
            console.log("Error when trying "+host+" is below.\n"+error)
            return false
        }
    }

    // check local connection
    if (await test_connection(LOCAL_HOST)) {
        console.log("Using local")
        return LOCAL_HOST
    } else {
        console.log("Local failed")
        if (await test_connection(TUNNEL_HOST)) {
            console.log("Using tunnel")
            return TUNNEL_HOST
        } else {
            console.log("No connection available")
            return null
        }
    }
}