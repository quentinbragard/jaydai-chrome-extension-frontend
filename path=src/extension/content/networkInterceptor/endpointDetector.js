function endpointDetector(url, provider) {
  const endpoints = ENDPOINTS[provider];
  
  for (const [endpointName, pattern] of Object.entries(endpoints)) {
    if (matchEndpoint(url, pattern)) {
      return endpointName;
    }
  }
  
  return null;
} 