const Geo = (() => {
  const R = 6371000; // earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  function distanceMeters(lat1, lon1, lat2, lon2) {
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function bearingDegrees(lat1, lon1, lat2, lon2) {
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function formatDistance(meters) {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  }

  // Given a start point, a bearing (degrees from true north) and a distance
  // in meters, returns the resulting {lat, lon}. Used to turn a scenario's
  // relative waypoints (bearing + distance) into real coordinates once a
  // physical starting point is chosen on-site — every device that starts
  // from the same spot computes the exact same waypoints independently,
  // with no data exchanged between devices.
  function destinationPoint(lat, lon, bearingDeg, distanceM) {
    const delta = distanceM / R;
    const theta = toRad(bearingDeg);
    const phi1 = toRad(lat);
    const lambda1 = toRad(lon);

    const phi2 = Math.asin(
      Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
    );
    const lambda2 =
      lambda1 +
      Math.atan2(
        Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
      );

    return { lat: toDeg(phi2), lon: ((toDeg(lambda2) + 540) % 360) - 180 };
  }

  return { distanceMeters, bearingDegrees, formatDistance, destinationPoint };
})();
