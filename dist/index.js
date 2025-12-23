var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/index.ts
var app = new Hono2();
var SYSTEM_PROMPT = `You are a sophisticated, wise, and friendly AI assistant.
Your tone should be professional, helpful, and well-rounded. Be detailed, factual, and supportive.
Encourage learning and critical thinking. Be deep, meaningful, and accurate.
 Avoid using tables as much as possible. Do not use LaTeX formatting for math (like [ ] or sqrt or anything starting with ). Use standard Unicode symbols (e.g. \u221A, \xD7, \u2248) and plain text for equations to ensure they render correctly on Telegram.`;
var KEYBOARDS = {
  en: {
    lang: {
      keyboard: [
        [{ text: "English \u{1F1EC}\u{1F1E7}" }, { text: "\u0641\u0627\u0631\u0633\u06CC \u{1F1EE}\u{1F1F7}" }],
        [{ text: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439 \u{1F1F7}\u{1F1FA}" }, { text: "\u4E2D\u6587 \u{1F1E8}\u{1F1F3}" }],
        [{ text: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u{1F1F8}\u{1F1E6}" }, { text: "Espa\xF1ol \u{1F1EA}\u{1F1F8}" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  }
};
function getModelKeyboard(lang, hasGeminiKey) {
  const isFa = lang === "fa";
  const lock = hasGeminiKey ? "" : " \u{1F512}";
  if (isFa) {
    return {
      keyboard: [
        [{ text: "\u{1F916} \u062C\u06CC\u200C\u067E\u06CC\u200C\u062A\u06CC (120B)" }],
        [{ text: "\u{1F963} \u06A9\u0627\u0645\u067E\u0627\u0646\u062F (Groq)" }],
        [{ text: "\u{1F441}\uFE0F \u0644\u0627\u0645\u0627 3.2 (Vision)" }, { text: "\u{1F984} \u0644\u0627\u0645\u0627 4 (17B)" }],
        [{ text: "\u{1F999} \u0644\u0627\u0645\u0627 3.3 (70B)" }, { text: "\u{1F409} \u06A9\u0648\u06CC\u0646 3 (32B)" }],
        [{ text: `\u{1F680} \u062C\u0645\u0646\u0627\u06CC 3.0 (Flash)${lock}` }, { text: `\u26A1 \u062C\u0645\u0646\u0627\u06CC 2.5 (Flash)${lock}` }],
        [{ text: `\u{1FAB6} \u062C\u0645\u0646\u0627\u06CC 2.5 (Lite)${lock}` }, { text: `\u{1F48E} Gemma 3 (27B)${lock}` }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  } else {
    return {
      keyboard: [
        [{ text: "\u{1F916} GPT OSS (120B)" }],
        [{ text: "\u{1F963} Compound (Groq)" }],
        [{ text: "\u{1F441}\uFE0F Llama 3.2 (Vision)" }, { text: "\u{1F984} Llama 4 (17B)" }],
        [{ text: "\u{1F999} Llama 3.3 (70B)" }, { text: "\u{1F409} Qwen 3 (32B)" }],
        [{ text: `\u{1F680} Gemini 3.0 (flash)${lock}` }, { text: `\u26A1 Gemini 2.5 (flash)${lock}` }],
        [{ text: `\u{1FAB6} Gemini 2.5 (Lite)${lock}` }, { text: `\u{1F48E} Gemma 3 (27B)${lock}` }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }
}
__name(getModelKeyboard, "getModelKeyboard");
var MODEL_MAP = {
  // English Keys - Groq models
  "\u{1F916} GPT OSS (120B)": "openai/gpt-oss-120b",
  "\u{1F999} Llama 3.3 (70B)": "llama-3.3-70b-versatile",
  "\u{1F984} Llama 4 (17B)": "meta-llama/llama-4-maverick-17b-128e-instruct",
  "\u{1F409} Qwen 3 (32B)": "qwen/qwen3-32b",
  "\u{1F441}\uFE0F Llama 3.2 (Vision)": "llama-3.2-90b-vision-preview",
  "\u{1F963} Compound (Groq)": "groq/compound",
  // English Keys - Gemini models (unlocked)
  "\u26A1 Gemini 2.5 (flash)": "gemini-2.5-flash",
  "\u{1FAB6} Gemini 2.5 (Lite)": "gemini-2.5-flash-lite",
  "\u{1F680} Gemini 3.0 (flash)": "gemini-3-flash-preview",
  "\u{1F48E} Gemma 3 (27B)": "gemma-3-27b-it",
  // English Keys - Gemini models (locked versions)
  "\u26A1 Gemini 2.5 (flash) \u{1F512}": "gemini-2.5-flash",
  "\u{1FAB6} Gemini 2.5 (Lite) \u{1F512}": "gemini-2.5-flash-lite",
  "\u{1F680} Gemini 3.0 (flash) \u{1F512}": "gemini-3-flash-preview",
  "\u{1F48E} Gemma 3 (27B) \u{1F512}": "gemma-3-27b-it",
  // Farsi Keys - Groq models
  "\u{1F916} \u062C\u06CC\u200C\u067E\u06CC\u200C\u062A\u06CC (120B)": "openai/gpt-oss-120b",
  "\u{1F999} \u0644\u0627\u0645\u0627 3.3 (70B)": "llama-3.3-70b-versatile",
  "\u{1F984} \u0644\u0627\u0645\u0627 4 (17B)": "meta-llama/llama-4-maverick-17b-128e-instruct",
  "\u{1F409} \u06A9\u0648\u06CC\u0646 3 (32B)": "qwen/qwen3-32b",
  "\u{1F441}\uFE0F \u0644\u0627\u0645\u0627 3.2 (Vision)": "llama-3.2-90b-vision-preview",
  "\u{1F963} \u06A9\u0627\u0645\u067E\u0627\u0646\u062F (Groq)": "groq/compound",
  // Farsi Keys - Gemini models (unlocked)
  "\u26A1 \u062C\u0645\u0646\u0627\u06CC 2.5 (Flash)": "gemini-2.5-flash",
  "\u{1FAB6} \u062C\u0645\u0646\u0627\u06CC 2.5 (Lite)": "gemini-2.5-flash-lite",
  "\u{1F680} \u062C\u0645\u0646\u0627\u06CC 3.0 (Flash)": "gemini-3-flash-preview",
  "\u{1F48E} \u062C\u0645\u0627 3 (27B)": "gemma-3-27b-it",
  // Farsi Keys - Gemini models (locked versions)
  "\u26A1 \u062C\u0645\u0646\u0627\u06CC 2.5 (Flash) \u{1F512}": "gemini-2.5-flash",
  "\u{1FAB6} \u062C\u0645\u0646\u0627\u06CC 2.5 (Lite) \u{1F512}": "gemini-2.5-flash-lite",
  "\u{1F680} \u062C\u0645\u0646\u0627\u06CC 3.0 (Flash) \u{1F512}": "gemini-3-flash-preview",
  "\u{1F48E} \u062C\u0645\u0627 3 (27B) \u{1F512}": "gemma-3-27b-it"
};
var MODEL_NAMES = {
  "gemini-3-flash-preview": "3.0 Flash",
  "gemini-2.5-flash": "2.5 Flash",
  "gemini-2.5-flash-lite": "2.5 Lite",
  "gemma-3-27b-it": "Gemma 3",
  "openai/gpt-oss-120b": "GPT OSS 120B",
  "llama-3.3-70b-versatile": "Llama 3.3",
  "meta-llama/llama-4-maverick-17b-128e-instruct": "Llama 4",
  "qwen/qwen3-32b": "Qwen 3",
  "llama-3.2-90b-vision-preview": "Llama 3.2 Vision",
  "groq/compound": "Compound",
  // Legacy
  "gemini-1.5-flash-latest": "1.5 Flash",
  "gemini-2.0-flash-exp": "2.0 Exp",
  "gemini-2.5-pro": "2.5 Pro",
  "gemini-3-pro-preview": "3.0 Pro"
};
function getMainKeyboard(lang, currentModelId) {
  const modelName = MODEL_NAMES[currentModelId] || "Unknown";
  let conversationsText = "\u2728 New Conversation";
  let brainLabel = "\u{1F9E0} Brain";
  let langLabel = "\u{1F310} Change Language";
  let settingsLabel = "\u2699\uFE0F Settings";
  if (lang === "fa") {
    conversationsText = "\u2728 \u06AF\u0641\u062A\u06AF\u0648\u06CC \u062C\u062F\u06CC\u062F";
    brainLabel = "\u{1F9E0} \u0645\u062F\u0644";
    langLabel = "\u{1F310} \u062A\u063A\u06CC\u06CC\u0631 \u0632\u0628\u0627\u0646";
    settingsLabel = "\u2699\uFE0F \u062A\u0646\u0638\u06CC\u0645\u0627\u062A";
  } else if (lang === "ru") {
    conversationsText = "\u2728 \u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442";
    brainLabel = "\u{1F9E0} \u041C\u043E\u0434\u0435\u043B\u044C";
    langLabel = "\u{1F310} \u0421\u043C\u0435\u043D\u0438\u0442\u044C \u044F\u0437\u044B\u043A";
    settingsLabel = "\u2699\uFE0F \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438";
  } else if (lang === "zh") {
    conversationsText = "\u2728 \u65B0\u5BF9\u8BDD";
    brainLabel = "\u{1F9E0} \u6A21\u578B";
    langLabel = "\u{1F310} \u66F4\u6539\u8BED\u8A00";
    settingsLabel = "\u2699\uFE0F \u8BBE\u7F6E";
  } else if (lang === "ar") {
    conversationsText = "\u2728 \u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629";
    brainLabel = "\u{1F9E0} \u0627\u0644\u062F\u0645\u0627\u063A";
    langLabel = "\u{1F310} \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0644\u063A\u0629";
    settingsLabel = "\u2699\uFE0F \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A";
  } else if (lang === "es") {
    conversationsText = "\u2728 Nueva conversaci\xF3n";
    brainLabel = "\u{1F9E0} Cerebro";
    langLabel = "\u{1F310} Cambiar Idioma";
    settingsLabel = "\u2699\uFE0F Configuraci\xF3n";
  }
  const brainText = `${brainLabel}: ${modelName}`;
  return {
    keyboard: [
      [{ text: conversationsText }],
      [{ text: brainText }],
      [{ text: settingsLabel }, { text: langLabel }]
    ],
    resize_keyboard: true,
    persistent_keyboard: true
  };
}
__name(getMainKeyboard, "getMainKeyboard");
function getSettingsKeyboard(lang) {
  if (lang === "fa") {
    return {
      keyboard: [
        [{ text: "\u{1F511} \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC API" }, { text: "\u2139\uFE0F \u062F\u0631\u0628\u0627\u0631\u0647 \u0631\u0628\u0627\u062A" }],
        [{ text: "\u{1F519} \u0628\u0627\u0632\u06AF\u0634\u062A" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  } else {
    return {
      keyboard: [
        [{ text: "\u{1F511} API Keys" }, { text: "\u2139\uFE0F Info" }],
        [{ text: "\u{1F519} Back" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }
}
__name(getSettingsKeyboard, "getSettingsKeyboard");
function getBackKeyboard(lang) {
  const isFa = lang === "fa";
  return {
    keyboard: [
      [{ text: isFa ? "\u{1F519} \u0628\u0627\u0632\u06AF\u0634\u062A" : "\u{1F519} Back" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}
__name(getBackKeyboard, "getBackKeyboard");
async function handleSettings(chatId, userId, text, lang, env) {
  const isFa = lang === "fa";
  const settingsParams = isFa ? ["\u2699\uFE0F \u062A\u0646\u0638\u06CC\u0645\u0627\u062A", "\u{1F511} \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC API", "\u{1F519} \u0628\u0627\u0632\u06AF\u0634\u062A", "\u2139\uFE0F \u062F\u0631\u0628\u0627\u0631\u0647 \u0631\u0628\u0627\u062A"] : ["\u2699\uFE0F Settings", "\u{1F511} API Keys", "\u{1F519} Back", "\u2139\uFE0F Info"];
  const [lblSettings, lblKeys, lblBack, lblInfo] = settingsParams;
  if (text === lblSettings) {
    const msg = isFa ? "\u2699\uFE0F \u0645\u0646\u0648\u06CC \u062A\u0646\u0638\u06CC\u0645\u0627\u062A:" : "\u2699\uFE0F Settings Menu:";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getSettingsKeyboard(lang));
    return true;
  }
  if (text === lblInfo) {
    const msg = isFa ? "\u{1F916} **\u062F\u0631\u0628\u0627\u0631\u0647 \u0631\u0628\u0627\u062A**\n\n\u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u0628\u0627 \u0639\u0634\u0642 \u0648 \u062A\u0644\u0627\u0634 \u0628\u0633\u06CC\u0627\u0631 \u062A\u0648\u0633\u0639\u0647 \u062F\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.\n\n\u{1F310} \u0633\u0648\u0631\u0633 \u06A9\u062F \u067E\u0631\u0648\u0698\u0647 \u062F\u0631 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 \u0645\u0648\u062C\u0648\u062F \u0627\u0633\u062A:\nhttps://github.com/s-alireza/TG-ChatBot\n\n\u2B50 \u0627\u06AF\u0631 \u0627\u0632 \u0627\u06CC\u0646 \u0631\u0628\u0627\u062A \u0631\u0627\u0636\u06CC \u0647\u0633\u062A\u06CC\u062F\u060C \u0644\u0637\u0641\u0627\u064B \u062F\u0631 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 \u0628\u0647 \u0645\u0627 \u0633\u062A\u0627\u0631\u0647 \u0628\u062F\u0647\u06CC\u062F!" : "\u{1F916} **About Bot**\n\nThis bot works with multiple AI models to assist you.\n\n\u{1F310} Project Source Code:\nhttps://github.com/s-alireza/TG-ChatBot\n\n\u2B50 If you like this bot, please give us a star on GitHub!";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getSettingsKeyboard(lang));
    return true;
  }
  if (text === lblBack) {
    const usageKey = `usage:${userId}`;
    const usageData = await env.TG_BOT_KV.get(usageKey);
    const usage = usageData ? JSON.parse(usageData) : {};
    const activeModel = usage.manualModel || "openai/gpt-oss-120b";
    const msg = isFa ? "\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0645\u0646\u0648\u06CC \u0627\u0635\u0644\u06CC." : "Back to main menu.";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getMainKeyboard(lang, activeModel));
    return true;
  }
  if (text === lblKeys) {
    const currentGroq = await env.TG_BOT_KV.get(`config:groq_key:${userId}`) ? "\u2705 Custom Set" : "\u{1F30D} Default";
    const currentGemini = await env.TG_BOT_KV.get(`config:gemini_key:${userId}`) ? "\u2705 Custom Set" : env.GEMINI_API_KEY ? "\u{1F30D} System Default" : "\u274C Not Set";
    const msg = isFa ? `\u{1F511} *\u0645\u062F\u06CC\u0631\u06CC\u062A \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC API*

\u0648\u0636\u0639\u06CC\u062A \u0641\u0639\u0644\u06CC:
\u2022 **Groq**: ${currentGroq}
\u2022 **Gemini**: ${currentGemini}

\u0628\u0631\u0627\u06CC \u062A\u0646\u0638\u06CC\u0645 \u06A9\u0644\u06CC\u062F \u062C\u062F\u06CC\u062F\u060C \u0622\u0646 \u0631\u0627 \u0627\u0631\u0633\u0627\u0644 \u06A9\u0646\u06CC\u062F:
- \`gsk_...\` \u0628\u0631\u0627\u06CC Groq
- \`AI...\` \u0628\u0631\u0627\u06CC Gemini

\u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u06A9\u0644\u06CC\u062F \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u062E\u0648\u062F\u060C \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F \`delete keys\`.` : `\u{1F511} *API Key Management*

Current Status:
\u2022 **Groq**: ${currentGroq}
\u2022 **Gemini**: ${currentGemini}

To set a key, just send it here:
- \`gsk_...\` for Groq
- \`AI...\` for Gemini

To remove your custom keys, type \`delete keys\`.`;
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getBackKeyboard(lang));
    return true;
  }
  if (text.startsWith("gsk_") && text.length > 20) {
    await env.TG_BOT_KV.put(`config:groq_key:${userId}`, text);
    const msg = isFa ? "\u2705 \u06A9\u0644\u06CC\u062F Groq \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0634\u0645\u0627 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F!" : "\u2705 Your custom Groq API Key has been saved!";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getBackKeyboard(lang));
    return true;
  }
  if (text.startsWith("AI") && text.length > 20 && !text.includes(" ")) {
    await env.TG_BOT_KV.put(`config:gemini_key:${userId}`, text);
    const msg = isFa ? "\u2705 \u06A9\u0644\u06CC\u062F Gemini \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0634\u0645\u0627 \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F! \u0645\u062F\u0644\u200C\u0647\u0627\u06CC \u062C\u0645\u0646\u0627\u06CC \u0628\u0627\u0632 \u0634\u062F\u0646\u062F." : "\u2705 Your custom Gemini API Key has been saved! Gemini models unlocked.";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getBackKeyboard(lang));
    return true;
  }
  if (text.toLowerCase() === "delete keys") {
    await env.TG_BOT_KV.delete(`config:groq_key:${userId}`);
    await env.TG_BOT_KV.delete(`config:gemini_key:${userId}`);
    const msg = isFa ? "\u{1F5D1}\uFE0F \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0634\u0645\u0627 \u062D\u0630\u0641 \u0634\u062F\u0646\u062F. \u0627\u0632 \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC \u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0633\u06CC\u0633\u062A\u0645 (\u062F\u0631 \u0635\u0648\u0631\u062A \u0648\u062C\u0648\u062F) \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u062E\u0648\u0627\u0647\u062F \u0634\u062F." : "\u{1F5D1}\uFE0F Custom keys deleted. Reverted to system defaults (if available).";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, getBackKeyboard(lang));
    return true;
  }
  return false;
}
__name(handleSettings, "handleSettings");
var GLOBAL_FALLBACK_ORDER = [
  "openai/gpt-oss-120b",
  "groq/compound",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
  "llama-3.2-90b-vision-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemma-3-27b-it"
];
async function isConfigured(kv, env, userId) {
  const userGroqKey = await kv.get(`config:groq_key:${userId}`);
  if (userGroqKey) return true;
  const globalGroqKey = await kv.get("config:groq_key");
  return !!globalGroqKey || !!env.GROQ_API_KEY;
}
__name(isConfigured, "isConfigured");
async function getGroqKey(kv, env, userId) {
  const userKey = await kv.get(`config:groq_key:${userId}`);
  if (userKey) return userKey;
  const globalKey = await kv.get("config:groq_key");
  return globalKey || env.GROQ_API_KEY || null;
}
__name(getGroqKey, "getGroqKey");
async function getGeminiKey(kv, env, userId) {
  const userKey = await kv.get(`config:gemini_key:${userId}`);
  if (userKey) return userKey;
  const globalKey = await kv.get("config:gemini_key");
  return globalKey || env.GEMINI_API_KEY || null;
}
__name(getGeminiKey, "getGeminiKey");
async function handleSetupWizard(chatId, userId, text, env) {
  const kv = env.TG_BOT_KV;
  if (await isConfigured(kv, env, userId)) {
    return { handled: false };
  }
  const ownerId = await kv.get("config:owner_id");
  if (!ownerId) {
    await kv.put("config:owner_id", userId.toString());
  } else if (ownerId !== userId.toString()) {
    return {
      handled: true,
      response: "\u26D4 This bot is being configured by another user. Please wait."
    };
  }
  const step = await kv.get(`setup_step:${userId}`) || "0";
  if (step === "0" && !text.startsWith("gsk_")) {
    await kv.put(`setup_step:${userId}`, "0");
    return {
      handled: true,
      response: `\u{1F916} *Welcome to TG-ChatBot Setup!*

Let's configure your bot in 2 simple steps.

*Step 1/2:* Send me your *Groq API Key*
Get it free from: console.groq.com/keys

_Your key should start with \`gsk_\`_`
    };
  }
  if (step === "0") {
    if (text.startsWith("gsk_") && text.length > 20) {
      const isValid = await validateGroqKey(text);
      if (isValid) {
        await kv.put("config:groq_key", text);
        await kv.put(`setup_step:${userId}`, "1");
        return {
          handled: true,
          response: `\u2705 *Groq API Key saved!*

*Step 2/2:* Send me your *Gemini API Key* (optional)
Get it from: aistudio.google.com/app/apikey

_Or send \`skip\` to use Groq only_`
        };
      } else {
        return {
          handled: true,
          response: "\u274C Invalid Groq API Key. Please check and try again.\n\n_The key should start with `gsk_`_"
        };
      }
    } else {
      return {
        handled: true,
        response: "Please send a valid Groq API Key.\n_It should start with `gsk_`_"
      };
    }
  }
  if (step === "1") {
    if (text.toLowerCase() === "skip") {
      await kv.put("config:gemini_key", "");
      await kv.put("config:setup_complete", "true");
      await kv.delete(`setup_step:${userId}`);
      return {
        handled: true,
        response: `\u{1F389} *Setup Complete!*

Your bot is ready to use!
Send me any message to start chatting.`
      };
    } else if (text.startsWith("AI") && text.length > 20) {
      await kv.put("config:gemini_key", text);
      await kv.put("config:setup_complete", "true");
      await kv.delete(`setup_step:${userId}`);
      return {
        handled: true,
        response: `\u{1F389} *Setup Complete!*

Both API keys are configured!
Send me any message to start chatting.`
      };
    } else {
      return {
        handled: true,
        response: "Please send a valid Gemini API Key or type `skip` to continue without it."
      };
    }
  }
  return { handled: false };
}
__name(handleSetupWizard, "handleSetupWizard");
async function validateGroqKey(key) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
__name(validateGroqKey, "validateGroqKey");
app.get("/", async (c) => {
  const env = c.env;
  const workerUrl = new URL(c.req.url);
  const webhookUrl = `${workerUrl.origin}/webhook`;
  await env.TG_BOT_KV.put("worker_url", workerUrl.origin);
  let webhookStatus = { set: false, url: "", error: "" };
  try {
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/getWebhookInfo`
    );
    const info = await infoResponse.json();
    if (info.ok && info.result.url) {
      webhookStatus.set = true;
      webhookStatus.url = info.result.url;
    }
  } catch (e) {
    webhookStatus.error = e.message;
  }
  let setupResult = { attempted: false, success: false, message: "" };
  if (!webhookStatus.set && !webhookStatus.error) {
    setupResult.attempted = true;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`
      );
      const result = await response.json();
      if (result.ok) {
        setupResult.success = true;
        setupResult.message = "Webhook configured automatically!";
        webhookStatus.set = true;
        webhookStatus.url = webhookUrl;
      } else {
        setupResult.message = result.description || "Failed to set webhook";
      }
    } catch (e) {
      setupResult.message = e.message;
    }
  }
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>TG-ChatBot Status</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eaeaea;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 500px;
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .emoji { font-size: 64px; margin-bottom: 20px; }
        h1 { margin: 0 0 10px 0; color: #e94560; }
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin: 20px 0;
        }
        .status.online { background: #00d26a; color: #000; }
        .status.offline { background: #e94560; color: #fff; }
        .info {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
        }
        .info-row { margin: 8px 0; }
        .info-label { color: #888; }
        code {
            background: rgba(0,0,0,0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            word-break: break-all;
        }
        .btn {
            display: inline-block;
            background: #e94560;
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
        }
        .btn:hover { background: #ff6b6b; }
        .success-msg { color: #00d26a; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">\u{1F916}</div>
        <h1>TG-ChatBot</h1>
        <p>Your AI-powered Telegram bot</p>
        
        <div class="status ${webhookStatus.set ? "online" : "offline"}">
            ${webhookStatus.set ? "\u2705 Online & Ready" : "\u26A0\uFE0F Webhook Not Set"}
        </div>
        
        ${setupResult.attempted && setupResult.success ? `
            <p class="success-msg">\u{1F389} ${setupResult.message}</p>
        ` : ""}
        
        <div class="info">
            <div class="info-row">
                <span class="info-label">Worker URL:</span><br>
                <code>${workerUrl.origin}</code>
            </div>
            <div class="info-row">
                <span class="info-label">Webhook:</span><br>
                <code>${webhookStatus.url || "Not configured"}</code>
            </div>
            <div class="info-row">
                <span class="info-label">Access Mode:</span>
                <code>${env.ACCESS_MODE || "public"}</code>
            </div>
        </div>
        
        ${webhookStatus.set ? `
            <p>Your bot is ready! Send a message on Telegram to test it.</p>
        ` : `
            <a href="/setup-webhook" class="btn">\u{1F527} Setup Webhook</a>
        `}
    </div>
</body>
</html>`;
  return c.html(html);
});
app.get("/setup-webhook", async (c) => {
  const env = c.env;
  const workerUrl = new URL(c.req.url);
  const webhookUrl = `${workerUrl.origin}/webhook`;
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/setWebhook?url=${webhookUrl}`
    );
    const result = await response.json();
    if (result.ok) {
      return c.redirect("/");
    } else {
      return c.json({
        success: false,
        message: "Failed to set webhook",
        error: result.description
      }, 400);
    }
  } catch (error) {
    return c.json({
      success: false,
      message: "Error setting webhook",
      error: error.message
    }, 500);
  }
});
app.post("/webhook", async (c) => {
  const update = await c.req.json();
  const env = c.env;
  const message = update.message;
  if (!message) return c.json({ ok: true });
  const chatId = message.chat.id;
  const userId = message.from.id;
  let text = message.text || message.caption || "";
  const setupResult = await handleSetupWizard(chatId, userId, text, env);
  if (setupResult.handled) {
    if (setupResult.response) {
      await sendMessage(chatId, setupResult.response, env.TELEGRAM_TOKEN);
    }
    return c.json({ ok: true });
  }
  const groqApiKey = await getGroqKey(env.TG_BOT_KV, env, userId);
  const geminiApiKey = await getGeminiKey(env.TG_BOT_KV, env, userId);
  if (!groqApiKey) {
    await sendMessage(chatId, "\u26A0\uFE0F Bot not configured. Please contact the owner.", env.TELEGRAM_TOKEN);
    return c.json({ ok: true });
  }
  let isVoiceMessage = false;
  let mediaData = null;
  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    const base64Data = await getTelegramFile(largestPhoto.file_id, env.TELEGRAM_TOKEN);
    if (base64Data) {
      mediaData = { mimeType: "image/jpeg", data: base64Data };
    }
  } else if (message.document) {
    const mime = message.document.mime_type;
    if (mime === "application/pdf" || mime?.startsWith("image/")) {
      const base64Data = await getTelegramFile(message.document.file_id, env.TELEGRAM_TOKEN);
      if (base64Data) {
        mediaData = { mimeType: mime, data: base64Data };
      }
    }
  } else if (message.voice) {
    const fileBuffer = await getTelegramFileBuffer(message.voice.file_id, env.TELEGRAM_TOKEN);
    if (fileBuffer) {
      try {
        text = await transcribeAudio(fileBuffer.buffer, groqApiKey);
        isVoiceMessage = true;
        await sendMessage(message.chat.id, `\u{1F4DD} You said: '${text}'`, env.TELEGRAM_TOKEN);
      } catch (e) {
        console.error("Transcription failed", e);
        await sendMessage(message.chat.id, "\u274C Valid Error: Could not transcribe audio.", env.TELEGRAM_TOKEN);
      }
    }
  }
  if (!text && !mediaData) return c.json({ ok: true });
  if (env.ACCESS_MODE === "private") {
    const allowedIds = (env.ALLOWED_USER_IDS || "").split(",").map((id) => id.trim());
    if (!allowedIds.includes(userId.toString())) {
      console.log(`Unauthorized access attempt from: ${userId}`);
      await sendMessage(chatId, "Access Denied \u26D4\nYou are not authorized to use this bot.", env.TELEGRAM_TOKEN);
      return c.json({ ok: true });
    }
  }
  const langKey = `lang:${userId}`;
  let userLang = await env.TG_BOT_KV.get(langKey);
  if (await handleSettings(chatId, userId, text, userLang || "en", env)) {
    return c.json({ ok: true });
  }
  if (text.includes("Change Language") || text.includes("\u062A\u063A\u06CC\u06CC\u0631 \u0632\u0628\u0627\u0646") || text.includes("\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u044F\u0437\u044B\u043A") || text.includes("\u66F4\u6539\u8BED\u8A00") || text.includes("\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0644\u063A\u0629") || text.includes("Cambiar Idioma")) {
    await env.TG_BOT_KV.delete(langKey);
    await sendMessage(chatId, "Please choose your language:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
    return c.json({ ok: true });
  }
  const usageKey = `usage:${userId}`;
  const usageData = await env.TG_BOT_KV.get(usageKey);
  const usage = usageData ? JSON.parse(usageData) : {};
  let activeModel = usage.manualModel || "openai/gpt-oss-120b";
  let processingModel = activeModel;
  if (isVoiceMessage) {
    processingModel = "llama-3.3-70b-versatile";
  }
  if (!userLang) {
    if (text.includes("English")) {
      await env.TG_BOT_KV.put(langKey, "en");
      await sendMessage(chatId, "Language set to English! \u{1F1EC}\u{1F1E7}\nHello! I'm your AI assistant.", env.TELEGRAM_TOKEN, getMainKeyboard("en", activeModel));
    } else if (text.includes("\u0641\u0627\u0631\u0633\u06CC") || text.includes("Persian")) {
      await env.TG_BOT_KV.put(langKey, "fa");
      await sendMessage(chatId, "\u0632\u0628\u0627\u0646 \u0631\u0648\u06CC \u0641\u0627\u0631\u0633\u06CC \u062A\u0646\u0638\u06CC\u0645 \u0634\u062F! \u{1F1EE}\u{1F1F7}\n\u0633\u0644\u0627\u0645! \u0645\u0646 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u0634\u0645\u0627 \u0647\u0633\u062A\u0645.", env.TELEGRAM_TOKEN, getMainKeyboard("fa", activeModel));
    } else if (text.includes("\u0420\u0443\u0441\u0441\u043A\u0438\u0439")) {
      await env.TG_BOT_KV.put(langKey, "ru");
      await sendMessage(chatId, "\u042F\u0437\u044B\u043A \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u043D\u0430 \u0420\u0443\u0441\u0441\u043A\u0438\u0439! \u{1F1F7}\u{1F1FA}\n\u041F\u0440\u0438\u0432\u0435\u0442! \u042F \u0432\u0430\u0448 \u0418\u0418-\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A.", env.TELEGRAM_TOKEN, getMainKeyboard("ru", activeModel));
    } else if (text.includes("\u4E2D\u6587")) {
      await env.TG_BOT_KV.put(langKey, "zh");
      await sendMessage(chatId, "\u8BED\u8A00\u5DF2\u8BBE\u7F6E\u4E3A\u4E2D\u6587! \u{1F1E8}\u{1F1F3}\n\u4F60\u597D\uFF01\u6211\u662F\u4F60\u7684AI\u52A9\u624B\u3002", env.TELEGRAM_TOKEN, getMainKeyboard("zh", activeModel));
    } else if (text.includes("\u0627\u0644\u0639\u0631\u0628\u064A\u0629")) {
      await env.TG_BOT_KV.put(langKey, "ar");
      await sendMessage(chatId, "\u062A\u0645 \u0636\u0628\u0637 \u0627\u0644\u0644\u063A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064A\u0629! \u{1F1F8}\u{1F1E6}\n\u0623\u0647\u0644\u0627\u064B! \u0623\u0646\u0627 \u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0643.", env.TELEGRAM_TOKEN, getMainKeyboard("ar", activeModel));
    } else if (text.includes("Espa\xF1ol")) {
      await env.TG_BOT_KV.put(langKey, "es");
      await sendMessage(chatId, "\xA1Idioma configurado en Espa\xF1ol! \u{1F1EA}\u{1F1F8}\n\xA1Hola! Soy tu asistente de IA.", env.TELEGRAM_TOKEN, getMainKeyboard("es", activeModel));
    } else {
      await sendMessage(chatId, "Please choose your language:", env.TELEGRAM_TOKEN, KEYBOARDS.en.lang);
    }
    return c.json({ ok: true });
  }
  const isPersian = userLang === "fa";
  const userGeminiKey = await env.TG_BOT_KV.get(`config:gemini_key:${userId}`);
  const hasGeminiKey = !!userGeminiKey || !!env.GEMINI_API_KEY;
  const currentKeyboard = getMainKeyboard(userLang, activeModel);
  const modelKeyboard = getModelKeyboard(userLang, hasGeminiKey);
  let localizedSystemPrompt = SYSTEM_PROMPT;
  if (isVoiceMessage) {
    localizedSystemPrompt += " Keep your response conversational and under 750 characters.";
    if (userLang === "en") localizedSystemPrompt += " Respond in English.";
    else if (userLang === "fa") localizedSystemPrompt += " Respond in Persian/Farsi.";
    else if (userLang === "ru") localizedSystemPrompt += " Respond in Russian.";
    else if (userLang === "zh") localizedSystemPrompt += " Respond in Chinese.";
    else if (userLang === "ar") localizedSystemPrompt += " Respond in Arabic.";
    else if (userLang === "es") localizedSystemPrompt += " Respond in Spanish.";
  } else {
    localizedSystemPrompt += " Keep your response concise and under 4000 characters to fit in a single message.";
    if (userLang === "fa") localizedSystemPrompt += " Respond in Persian/Farsi. Be professional and academic.";
    else if (userLang === "ru") localizedSystemPrompt += " Respond in Russian.";
    else if (userLang === "zh") localizedSystemPrompt += " Respond in Chinese.";
    else if (userLang === "ar") localizedSystemPrompt += " Respond in Arabic.";
    else if (userLang === "es") localizedSystemPrompt += " Respond in Spanish.";
  }
  if (text === "/start") {
    const welcome = isPersian ? "\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F! \u{1F916}\n\u0686\u0637\u0648\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u0645 \u0627\u0645\u0631\u0648\u0632 \u0628\u0647 \u0634\u0645\u0627 \u06A9\u0645\u06A9 \u06A9\u0646\u0645\u061F" : "Welcome! \u{1F916}\nHow can I help you today?";
    await sendMessage(chatId, welcome, env.TELEGRAM_TOKEN, currentKeyboard);
    return c.json({ ok: true });
  }
  if (text.includes("Change Brain") || text.includes("\u062A\u063A\u06CC\u06CC\u0631 \u0645\u063A\u0632") || text.includes("Brain:") || text.includes("\u0645\u062F\u0644:") || text.includes("\u041C\u043E\u0434\u0435\u043B\u044C:") || text.includes("\u6A21\u578B:") || text.includes("\u0646\u0645\u0648\u0630\u062C:") || text.includes("Cerebro:")) {
    let msg = "Which AI model would you like to use? \u{1F9E0}";
    if (userLang === "fa") msg = "\u06A9\u062F\u0627\u0645 \u0645\u062F\u0644 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u0631\u0627 \u062A\u0631\u062C\u06CC\u062D \u0645\u06CC\u200C\u062F\u0647\u06CC\u062F\u061F \u{1F9E0}";
    else if (userLang === "ru") msg = "\u041A\u0430\u043A\u0443\u044E \u043C\u043E\u0434\u0435\u043B\u044C \u0418\u0418 \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C? \u{1F9E0}";
    else if (userLang === "zh") msg = "\u60A8\u60F3\u4F7F\u7528\u54EA\u4E2AAI\u6A21\u578B\uFF1F \u{1F9E0}";
    else if (userLang === "ar") msg = "\u0623\u064A \u0646\u0645\u0648\u0630\u062C \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062A\u0648\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647\u061F \u{1F9E0}";
    else if (userLang === "es") msg = "\xBFQu\xE9 modelo de IA te gustar\xEDa usar? \u{1F9E0}";
    await sendMessage(chatId, msg, env.TELEGRAM_TOKEN, modelKeyboard);
    return c.json({ ok: true });
  }
  if (MODEL_MAP[text]) {
    const selectedModel = MODEL_MAP[text];
    const isGeminiModel = selectedModel.startsWith("gemini") || selectedModel.startsWith("gemma");
    if (isGeminiModel && !hasGeminiKey) {
      const lockedMsg = isPersian ? `\u26A0\uFE0F \u0627\u06CC\u0646 \u0645\u062F\u0644 \u0642\u0641\u0644 \u0627\u0633\u062A! \u{1F512}

\u0628\u0631\u0627\u06CC \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u0645\u062F\u0644\u200C\u0647\u0627\u06CC Gemini\u060C \u0627\u0628\u062A\u062F\u0627 \u0628\u0627\u06CC\u062F GEMINI_API_KEY \u0631\u0627 \u062F\u0631 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u06CC\u062F.

\u{1F4A1} \u0645\u062F\u0644\u200C\u0647\u0627\u06CC Groq (\u0628\u062F\u0648\u0646 \u0639\u0644\u0627\u0645\u062A \u0642\u0641\u0644) \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0647\u0633\u062A\u0646\u062F.` : `\u26A0\uFE0F This model is locked! \u{1F512}

To use Gemini models, you need to add your GEMINI_API_KEY in the settings first.

\u{1F4A1} Groq models (without \u{1F512}) are available for use.`;
      await sendMessage(chatId, lockedMsg, env.TELEGRAM_TOKEN, currentKeyboard);
      return c.json({ ok: true });
    }
    usage.manualModel = selectedModel;
    await env.TG_BOT_KV.put(usageKey, JSON.stringify(usage));
    const newKeyboard = getMainKeyboard(userLang, selectedModel);
    const confirmMsg = isPersian ? `\u0645\u062F\u0644 \u0628\u0647 ${text} \u062A\u0646\u0638\u06CC\u0645 \u0634\u062F. \u2705` : `Model set to: ${text}. \u2705`;
    await sendMessage(chatId, confirmMsg, env.TELEGRAM_TOKEN, newKeyboard);
    return c.json({ ok: true });
  }
  if (text.includes("New Conversation") || text.includes("\u06AF\u0641\u062A\u06AF\u0648\u06CC \u062C\u062F\u06CC\u062F") || text.includes("\u041D\u043E\u0432\u044B\u0439 \u0447\u0430\u0442") || text.includes("\u65B0\u5BF9\u8BDD") || text.includes("\u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629") || text.includes("Nueva Conversaci\xF3n")) {
    await env.TG_BOT_KV.delete(`history:${userId}`);
    let clearMsg = "Previous conversation cleared. I'm ready! \u2728";
    if (userLang === "fa") clearMsg = "\u06AF\u0641\u062A\u06AF\u0648\u06CC \u0642\u0628\u0644\u06CC \u067E\u0627\u06A9 \u0634\u062F. \u0628\u0641\u0631\u0645\u0627\u06CC\u06CC\u062F! \u2728";
    else if (userLang === "ru") clearMsg = "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430. \u042F \u0433\u043E\u0442\u043E\u0432! \u2728";
    else if (userLang === "zh") clearMsg = "\u4E0A\u6B21\u5BF9\u8BDD\u5DF2\u6E05\u9664\u3002\u6211\u51C6\u5907\u597D\u4E86\uFF01\u2728";
    else if (userLang === "ar") clearMsg = "\u062A\u0645 \u0645\u0633\u062D \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629. \u0623\u0646\u0627 \u0645\u0633\u062A\u0639\u062F! \u2728";
    else if (userLang === "es") clearMsg = "Conversaci\xF3n anterior borrada. \xA1Estoy listo! \u2728";
    await sendMessage(chatId, clearMsg, env.TELEGRAM_TOKEN, currentKeyboard);
    return c.json({ ok: true });
  }
  let promptToGemini = text;
  let history = [];
  const historyKey = `history:${userId}`;
  const historyData = await env.TG_BOT_KV.get(historyKey);
  if (historyData) {
    history = JSON.parse(historyData);
  }
  if (!promptToGemini && mediaData) {
    promptToGemini = isPersian ? "\u0644\u0637\u0641\u0627 \u0627\u06CC\u0646 \u0631\u0627 \u062A\u062D\u0644\u06CC\u0644 \u06A9\u0646\u06CC\u062F." : "Please analyze this.";
  }
  history.push({ role: "user", parts: [{ text: promptToGemini }] });
  let initialModel = processingModel;
  let aiResponse = "";
  let success = false;
  let lastError = "";
  let switchWarnings = "";
  let startIndex = GLOBAL_FALLBACK_ORDER.indexOf(initialModel);
  if (startIndex === -1) startIndex = 0;
  let currentModelIndex = startIndex;
  while (!success && currentModelIndex < GLOBAL_FALLBACK_ORDER.length) {
    const attemptModel = GLOBAL_FALLBACK_ORDER[currentModelIndex];
    const isGemini = attemptModel.startsWith("gemini") || attemptModel.startsWith("gemma");
    try {
      if (mediaData && !isGemini) {
        console.log(`Skipping ${attemptModel} because it does not support media.`);
        currentModelIndex++;
        continue;
      }
      if (history.length > 20) history = history.slice(history.length - 20);
      if (isGemini) {
        aiResponse = await callGemini(geminiApiKey || "", localizedSystemPrompt, history, promptToGemini, attemptModel, mediaData);
      } else {
        aiResponse = await callGroq(groqApiKey, localizedSystemPrompt, history, promptToGemini, attemptModel);
      }
      success = true;
    } catch (error) {
      console.error(`Model ${attemptModel} failed:`, error);
      lastError = error.message;
      const nextIndex = currentModelIndex + 1;
      if (nextIndex < GLOBAL_FALLBACK_ORDER.length) {
        const failedName = MODEL_NAMES[attemptModel] || attemptModel;
        let actualNextIndex = nextIndex;
        let foundNext = false;
        while (actualNextIndex < GLOBAL_FALLBACK_ORDER.length) {
          const candidate = GLOBAL_FALLBACK_ORDER[actualNextIndex];
          const isCandidateGemini = candidate.startsWith("gemini") || candidate.startsWith("gemma");
          if (mediaData && !isCandidateGemini) {
            actualNextIndex++;
            continue;
          }
          foundNext = true;
          break;
        }
        if (foundNext) {
          const nextModelId = GLOBAL_FALLBACK_ORDER[actualNextIndex];
          const nextName = MODEL_NAMES[nextModelId] || nextModelId;
          const msg = isPersian ? `\u26A0\uFE0F \u0645\u062F\u0644 ${failedName} \u067E\u0627\u0633\u062E \u0646\u062F\u0627\u062F. \u062A\u0644\u0627\u0634 \u0628\u0627 ${nextName}...` : `\u26A0\uFE0F ${failedName} failed. Switching to ${nextName}...`;
          switchWarnings += `_${msg}_
`;
        }
      }
      currentModelIndex++;
    }
  }
  try {
    if (success) {
      if (switchWarnings) {
        aiResponse = switchWarnings + "\n" + aiResponse;
      }
      await sendMessage(chatId, aiResponse, env.TELEGRAM_TOKEN, currentKeyboard);
      if (isVoiceMessage) {
        const cleanText = aiResponse.replace(/[*_#\`]/g, "").replace(/⚠️.*?(\n|$)/g, "").trim();
        try {
          let audioBuffer;
          try {
            audioBuffer = await generateSpeech(cleanText, groqApiKey, userLang || "en");
          } catch (groqError) {
            console.error("Groq TTS Failed, regenerating for Google Fallback:", groqError);
            await sendMessage(chatId, `\u26A0\uFE0F Primary TTS failed. Regenerating shorter response...`, env.TELEGRAM_TOKEN);
            const shortPrompt = localizedSystemPrompt.replace("under 750 characters", "under 200 characters");
            let shortResponse = "";
            try {
              if (processingModel.startsWith("gemini") || processingModel.startsWith("gemma")) {
                shortResponse = await callGemini(geminiApiKey || "", shortPrompt, [], text, processingModel, null);
              } else {
                shortResponse = await callGroq(groqApiKey, shortPrompt, [], text, processingModel);
              }
            } catch (regenError) {
              console.error("Regeneration failed, using truncated response:", regenError);
              shortResponse = cleanText.substring(0, 200);
            }
            const shortClean = shortResponse.replace(/[*_#\`]/g, "").replace(/⚠️.*?(\n|$)/g, "").trim();
            audioBuffer = await generateSpeechGoogle(shortClean, userLang || "en");
          }
          await sendVoiceMessage(chatId, audioBuffer, env.TELEGRAM_TOKEN);
        } catch (e) {
          console.error("TTS Generation failed:", e);
          await sendMessage(chatId, `\u274C TTS Error: ${e.message}`, env.TELEGRAM_TOKEN);
        }
      }
      history.push({ role: "model", parts: [{ text: aiResponse }] });
      await env.TG_BOT_KV.put(historyKey, JSON.stringify(history));
    } else {
      const errorMessage = isPersian ? `\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u062A\u0645\u0627\u0645 \u0645\u062F\u0644\u200C\u0647\u0627: ${lastError}` : `All AI brains failed. Last error: ${lastError}`;
      await sendMessage(chatId, errorMessage, env.TELEGRAM_TOKEN);
    }
  } catch (e) {
    console.error("Error sending response:", e);
  }
  return c.json({ ok: true });
});
function formatTelegramMessage(text) {
  text = text.replace(/^#{1,6}\s+(.*?)$/gm, "*$1*");
  text = text.replace(/\*\*(.*?)\*\*/g, "*$1*");
  text = text.replace(/__(.*?)__/g, "*$1*");
  text = text.replace(/^[-*]\s+/gm, "\u2022 ");
  text = text.replace(/\\\[/g, "\n").replace(/\\\]/g, "\n");
  text = text.replace(/\\\(/g, "").replace(/\\\)/g, "");
  text = text.replace(/\\sqrt/g, "\u221A");
  text = text.replace(/\\times/g, "\xD7");
  text = text.replace(/\\approx/g, "\u2248");
  text = text.replace(/\\neq/g, "\u2260");
  text = text.replace(/\\leq/g, "\u2264");
  text = text.replace(/\\geq/g, "\u2265");
  text = text.replace(/\\text\{(.*?)\}/g, "$1");
  text = text.replace(/\\ /g, " ");
  return text;
}
__name(formatTelegramMessage, "formatTelegramMessage");
async function sendMessage(chatId, text, token, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const MAX_LENGTH = 4096;
  text = formatTelegramMessage(text);
  const sendChunk = /* @__PURE__ */ __name(async (chunk, markup = null) => {
    const body = {
      chat_id: chatId,
      text: chunk,
      parse_mode: "Markdown"
    };
    if (markup) {
      body.reply_markup = markup;
    }
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!result.ok) {
        console.error("Telegram API Error:", result, "Chunk length:", chunk.length);
        if (result.description && result.description.includes("parse")) {
          console.log("Retrying without Markdown...");
          body.parse_mode = void 0;
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  }, "sendChunk");
  if (text.length <= MAX_LENGTH) {
    await sendChunk(text, replyMarkup);
  } else {
    const lines = text.split("\n");
    let currentChunk = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWithNewline = line + "\n";
      if (currentChunk.length + lineWithNewline.length > MAX_LENGTH) {
        await sendChunk(currentChunk, null);
        currentChunk = lineWithNewline;
      } else {
        currentChunk += lineWithNewline;
      }
    }
    if (currentChunk.length > 0) {
      await sendChunk(currentChunk, replyMarkup);
    }
  }
}
__name(sendMessage, "sendMessage");
async function getTelegramFile(fileId, token) {
  try {
    const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
    const infoResp = await fetch(fileInfoUrl);
    const infoData = await infoResp.json();
    if (!infoData.ok || !infoData.result?.file_path) {
      console.error("Telegram getFile failed:", infoData);
      return null;
    }
    const filePath = infoData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const fileResp = await fetch(downloadUrl);
    const arrayBuffer = await fileResp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const len = bytes.byteLength;
    const chunkSize = 1024;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  } catch (error) {
    console.error("Error downloading/encoding file:", error);
    return null;
  }
}
__name(getTelegramFile, "getTelegramFile");
async function getTelegramFileBuffer(fileId, token) {
  try {
    const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
    const infoResp = await fetch(fileInfoUrl);
    const infoData = await infoResp.json();
    if (!infoData.ok || !infoData.result?.file_path) return null;
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${infoData.result.file_path}`;
    const fileResp = await fetch(downloadUrl);
    const buffer = await fileResp.arrayBuffer();
    return { buffer, mimeType: "audio/ogg" };
  } catch (error) {
    console.error("Error downloading file buffer:", error);
    return null;
  }
}
__name(getTelegramFileBuffer, "getTelegramFileBuffer");
async function transcribeAudio(audioBuffer, apiKey, fileName = "voice.ogg") {
  const url = `https://api.groq.com/openai/v1/audio/transcriptions`;
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: "audio/ogg" });
  formData.append("file", blob, fileName);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`
    },
    body: formData
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Transcription Error:", data);
    throw new Error(data.error?.message || "Transcription failed");
  }
  return data.text;
}
__name(transcribeAudio, "transcribeAudio");
async function generateSpeech(text, apiKey, lang = "en") {
  const url = `https://api.groq.com/openai/v1/audio/speech`;
  let model = "playai-tts";
  let voice = "Briggs-PlayAI";
  if (lang === "ar") {
    model = "playai-tts-arabic";
    voice = "Ahmad-PlayAI";
  } else if (lang !== "en") {
    throw new Error(`Groq PlayAI does not support language: ${lang}`);
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: text,
      voice
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error("TTS Error:", errText);
    throw new Error(`TTS API Failed: ${errText}`);
  }
  return await response.arrayBuffer();
}
__name(generateSpeech, "generateSpeech");
async function sendVoiceMessage(chatId, audioBuffer, token, caption) {
  const url = `https://api.telegram.org/bot${token}/sendVoice`;
  const formData = new FormData();
  formData.append("chat_id", chatId.toString());
  if (caption) formData.append("caption", caption);
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  formData.append("voice", blob, "response.mp3");
  await fetch(url, {
    method: "POST",
    body: formData
  });
}
__name(sendVoiceMessage, "sendVoiceMessage");
async function callGroq(apiKey, systemPrompt, history, currentPrompt, model, mediaData = null) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  if (mediaData && mediaData.mimeType.startsWith("image/")) {
    console.log("Image detected! Switching Groq model to llama-3.2-11b-vision-preview (or 90b).");
    model = "llama-3.2-90b-vision-preview";
  }
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === "model" ? "assistant" : "user",
      content: msg.parts[0].text
    }))
  ];
  if (mediaData && mediaData.mimeType.startsWith("image/")) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: currentPrompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${mediaData.mimeType};base64,${mediaData.data}`
          }
        }
      ]
    });
  } else {
    messages.push({ role: "user", content: currentPrompt });
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "TinaBot/1.0"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096
      // Vision models might need this explicitly
    })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Groq API Error:", data);
    throw new Error(data.error?.message || `Groq API Error: ${response.statusText}`);
  }
  return data.choices[0].message.content;
}
__name(callGroq, "callGroq");
async function callGemini(apiKey, systemInstruction, history, currentText, model = "gemini-1.5-flash", mediaData = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const finalPrompt = `${systemInstruction}

User says: ${currentText}`;
  const cleanHistory = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: msg.parts
  }));
  const userParts = [{ text: finalPrompt }];
  if (mediaData) {
    userParts.push({
      inline_data: {
        mime_type: mediaData.mimeType,
        data: mediaData.data
      }
    });
  }
  const payload = {
    contents: [
      ...cleanHistory,
      { role: "user", parts: userParts }
    ],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7
    }
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    console.error("Gemini API Error Response:", JSON.stringify(data));
    if (data.error) {
      throw new Error(data.error.message || "Gemini API Error");
    }
    return "Analysis failed... (No candidates returned)";
  }
  return data.candidates[0].content.parts[0].text;
}
__name(callGemini, "callGemini");
async function generateSpeechGoogle(text, lang) {
  let safeText = text.substring(0, 200);
  if (lang === "fa") {
    safeText = "\u067E\u06CC\u0627\u0645 \u0634\u0645\u0627 \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F";
  }
  const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(safeText)}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });
  if (!resp.ok) throw new Error(`Google TTS failed: ${resp.status}`);
  return await resp.arrayBuffer();
}
__name(generateSpeechGoogle, "generateSpeechGoogle");
var index_default = {
  fetch: app.fetch
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
