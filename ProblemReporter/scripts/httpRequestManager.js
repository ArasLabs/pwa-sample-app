function requestManager(serverURL) {
    var instance = axios.create({
        baseURL: serverURL,
        withCredentials: true
    })


    return {
        httpGet: (url, config) => instance.get(url, config),
        httpPost: (url, data, config) => instance.post(url, data, config),

        instance: instance
    }
}