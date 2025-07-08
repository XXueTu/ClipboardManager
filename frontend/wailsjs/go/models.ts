export namespace models {
	
	export class ClipboardItem {
	    id: string;
	    content: string;
	    content_type: string;
	    title: string;
	    tags: string[];
	    category: string;
	    is_favorite: boolean;
	    use_count: number;
	    is_deleted: boolean;
	    // Go type: time
	    deleted_at?: any;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    // Go type: time
	    last_used_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ClipboardItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.content = source["content"];
	        this.content_type = source["content_type"];
	        this.title = source["title"];
	        this.tags = source["tags"];
	        this.category = source["category"];
	        this.is_favorite = source["is_favorite"];
	        this.use_count = source["use_count"];
	        this.is_deleted = source["is_deleted"];
	        this.deleted_at = this.convertValues(source["deleted_at"], null);
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.last_used_at = this.convertValues(source["last_used_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchQuery {
	    query: string;
	    category: string;
	    tags: string[];
	    type: string;
	    limit: number;
	    offset: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	        this.type = source["type"];
	        this.limit = source["limit"];
	        this.offset = source["offset"];
	    }
	}
	export class SearchResult {
	    items: ClipboardItem[];
	    total: number;
	    page: number;
	    page_size: number;
	    total_pages: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = this.convertValues(source["items"], ClipboardItem);
	        this.total = source["total"];
	        this.page = source["page"];
	        this.page_size = source["page_size"];
	        this.total_pages = source["total_pages"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Settings {
	    main_hotkey: string[];
	    escape_hotkey: string[];
	    position: string;
	    auto_capture: boolean;
	    max_items: number;
	    ignore_passwords: boolean;
	    ignore_images: boolean;
	    default_category: string;
	    auto_categorize: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.main_hotkey = source["main_hotkey"];
	        this.escape_hotkey = source["escape_hotkey"];
	        this.position = source["position"];
	        this.auto_capture = source["auto_capture"];
	        this.max_items = source["max_items"];
	        this.ignore_passwords = source["ignore_passwords"];
	        this.ignore_images = source["ignore_images"];
	        this.default_category = source["default_category"];
	        this.auto_categorize = source["auto_categorize"];
	    }
	}
	export class TagStat {
	    tag: string;
	    count: number;
	
	    static createFrom(source: any = {}) {
	        return new TagStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.tag = source["tag"];
	        this.count = source["count"];
	    }
	}
	export class Statistics {
	    total_items: number;
	    today_items: number;
	    week_items: number;
	    month_items: number;
	    type_stats: Record<string, number>;
	    category_stats: Record<string, number>;
	    top_tags: TagStat[];
	    recent_items: ClipboardItem[];
	
	    static createFrom(source: any = {}) {
	        return new Statistics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_items = source["total_items"];
	        this.today_items = source["today_items"];
	        this.week_items = source["week_items"];
	        this.month_items = source["month_items"];
	        this.type_stats = source["type_stats"];
	        this.category_stats = source["category_stats"];
	        this.top_tags = this.convertValues(source["top_tags"], TagStat);
	        this.recent_items = this.convertValues(source["recent_items"], ClipboardItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class WindowState {
	    visible: boolean;
	    animating: boolean;
	    message: string;
	    screenSize: string;
	    position: string;
	    isMonitoring: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WindowState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.visible = source["visible"];
	        this.animating = source["animating"];
	        this.message = source["message"];
	        this.screenSize = source["screenSize"];
	        this.position = source["position"];
	        this.isMonitoring = source["isMonitoring"];
	    }
	}

}

