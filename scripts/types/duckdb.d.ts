// Fallback ambient declaration for the optional native `duckdb` dependency.
// scripts/ingest-fsq.ts uses duckdb to query Foursquare's S3 parquet release.
// duckdb is an optionalDependency (heavy native build), so it may be absent in
// environments that only run the web app. This keeps `npm run typecheck:scripts`
// green without forcing the native install; when duckdb IS installed, its own
// shipped types are used at runtime.
//
// The script uses `duckdb.Database` in both value and type position, so we merge
// a namespace (types) with a value of `any`.
declare module 'duckdb' {
  namespace duckdb {
    type Database = any;
    type Connection = any;
    type Statement = any;
  }
  const duckdb: any;
  export = duckdb;
}
