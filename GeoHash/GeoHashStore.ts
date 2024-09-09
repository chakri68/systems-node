export class GeoHashStore {
  private locations: string[] = [];
  private readonly base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

  private generateGeoHash(latitude: number, longitude: number): string {
    let latRange = [-90.0, 90.0];
    let lonRange = [-180.0, 180.0];
    let geoHashBinary = "";

    for (let i = 0; i < 30; i++) {
      // 30 bits total, alternating between lon and lat
      let mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude > mid) {
        geoHashBinary += "1";
        lonRange[0] = mid;
      } else {
        geoHashBinary += "0";
        lonRange[1] = mid;
      }

      mid = (latRange[0] + latRange[1]) / 2;
      if (latitude > mid) {
        geoHashBinary += "1";
        latRange[0] = mid;
      } else {
        geoHashBinary += "0";
        latRange[1] = mid;
      }
    }

    let geoHash = "";
    for (let i = 0; i < geoHashBinary.length; i += 5) {
      const index = parseInt(geoHashBinary.slice(i, i + 5), 2);
      geoHash += this.base32[index];
    }

    return geoHash;
  }

  private decodeGeoHash(hash: string) {
    let latRange = [-90.0, 90.0];
    let lonRange = [-180.0, 180.0];
    let isEvenBit = true;

    for (let i = 0; i < hash.length; i++) {
      const c = hash.charAt(i);
      let num = this.base32.indexOf(c);
      if (num === -1) throw new Error("Invalid hash");

      for (let j = 4; j >= 0; j--) {
        const bit = (num >> j) & 1;
        if (isEvenBit) {
          const mid = (lonRange[0] + lonRange[1]) / 2;
          if (bit === 1) {
            lonRange[0] = mid;
          } else {
            lonRange[1] = mid;
          }
        } else {
          const mid = (latRange[0] + latRange[1]) / 2;
          if (bit === 1) {
            latRange[0] = mid;
          } else {
            latRange[1] = mid;
          }
        }
        isEvenBit = !isEvenBit;
      }
    }

    const latitude = (latRange[0] + latRange[1]) / 2;
    const longitude = (lonRange[0] + lonRange[1]) / 2;

    return { latitude, longitude };
  }
}
