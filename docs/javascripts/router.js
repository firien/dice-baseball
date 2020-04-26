// © Day Automation 2020

class Route {
  constructor(path, endpoint) {
    this.path = path;
    this.endpoint = endpoint;
    this.segments = this.path.split('/').filter(s => s.length !== 0)
  }
  get specificity() {
    return this.segments.length + this.segments.filter(s => s.startsWith(':')).length
  }
  match(url) {
    let params = {};
    let segments = url.pathname.split('/').filter(s => s.length !== 0);
    for (let [i, segment] of segments.entries()) {
      if (this.segments[i]) {
        if (this.segments[i].startsWith(':')) {
          let paramName = this.segments[i].slice(1)
          params[paramName] = segment;
        } else {
          if (this.segments[i] !== segment) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    // transfer any search params
    for (const [key, value] of url.searchParams) {
      params[key] = value;
    }
    return params;
  }
  dispatch(data, params) {
    this.endpoint.call(null, data, params);
  }
}

const bySpecificity = (a, b) => {
  return a.specificity - b.specificity;
}
class Router {
  constructor() {
    this.posts = [];
    this.gets = [];
    this.puts = [];
    this.deletes = [];
  }
  route(url, method, data) {
    switch (method?.toLowerCase()) {
      case 'post':
        method = 'posts'
        break;
      case 'put':
        method = 'puts'
        break;
      case 'delete':
        method = 'deletes'
        break;
      default:
        method = 'gets'
    }
    for (let route of this[method]) {
      let params = route.match(url);
      if (params) {
        route.dispatch(data, params);
        break;
      }
    }
  }
  get(path, endpoint) {
    this.gets.push(new Route(path, endpoint));
    this.gets = this.gets.sort(bySpecificity);
  }
  post(path, endpoint) {
    this.posts.push(new Route(path, endpoint));
    this.posts = this.posts.sort(bySpecificity);
  }
  put(path, endpoint) {
    this.puts.push(new Route(path, endpoint));
    this.puts = this.puts.sort(bySpecificity);
  }
  delete(path, endpoint) {
    this.deletes.push(new Route(path, endpoint));
    this.deletes = this.deletes.sort(bySpecificity);
  }
}

export default Router;
