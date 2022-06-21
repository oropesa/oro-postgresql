## 1.0.2 / 2022-06-21
* Updated lib `oro-functions` to `v1.1.7`.
* Updated lib-dev `jest` to `v28.1.1`.

## 1.0.1 / 2022-06-01
* Misc, allow to export _class_ `ResultArray`.

## 1.0.0 / 2022-06-01
* Added `MIT License`.
* Added _unit testing_ `Jest`.
* Added _package_ in `github.com` & `npmjs.com`.
* Added _fns_ `getFirstQuery`, `queryOnce`, improve security and performance.
* Updated `sanitize`, `boolean` is parsed to `tinyint (0|1)`; `null, undefined` is parsed to `NULL`; and `object`,`array` is parsed to `json stringify`.
* Updated `query`, when param _query_ failed and _format_ is `default`, it's returned `ResultArray`, else returned `false`.
* Updated `query`, when param _format_ is not allowed, or param _fnSanitize_ is not a function, it returns `false`.
* Updated lib `oro-functions` to `v1.1.5`.
* Updated lib `pg` to `v8.7.3`.

## 0.1.3 / 2021-08-26
* Update `oro-functions` to `1.0.0`.

## 0.1.1 & 0.1.2 / 2021-06-30
* Fix method `sanitize`.

## 0.1.0 / 2021-06-30
* Added changelog.
* Added method `sanitize` to avoid SQL injections.
