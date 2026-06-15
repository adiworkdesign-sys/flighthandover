declare module 'country-telephone-data' {
  interface CountryEntry {
    name: string;
    iso2: string;
    dialCode: string;
  }
  const telephoneData: {
    allCountries: CountryEntry[];
  };
  export = telephoneData;
}
