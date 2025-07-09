export namespace models {
	
	export class CategoryTagsResponse {
	    categories: string[];
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new CategoryTagsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.categories = source["categories"];
	        this.tags = source["tags"];
	    }
	}
	export class ChatMessage {
	    id: string;
	    session_id: string;
	    role: string;
	    content: string;
	    content_type: string;
	    metadata: Record<string, any>;
	    is_streaming: boolean;
	    is_complete: boolean;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ChatMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.session_id = source["session_id"];
	        this.role = source["role"];
	        this.content = source["content"];
	        this.content_type = source["content_type"];
	        this.metadata = source["metadata"];
	        this.is_streaming = source["is_streaming"];
	        this.is_complete = source["is_complete"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
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
	export class ChatMessageListResponse {
	    messages: ChatMessage[];
	    total: number;
	    has_more: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ChatMessageListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.messages = this.convertValues(source["messages"], ChatMessage);
	        this.total = source["total"];
	        this.has_more = source["has_more"];
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
	export class ChatSession {
	    id: string;
	    title: string;
	    description: string;
	    last_message: string;
	    message_count: number;
	    is_active: boolean;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    // Go type: time
	    last_active_at: any;
	
	    static createFrom(source: any = {}) {
	        return new ChatSession(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.last_message = source["last_message"];
	        this.message_count = source["message_count"];
	        this.is_active = source["is_active"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.last_active_at = this.convertValues(source["last_active_at"], null);
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
	export class ChatSessionListResponse {
	    sessions: ChatSession[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new ChatSessionListResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sessions = this.convertValues(source["sessions"], ChatSession);
	        this.total = source["total"];
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
	export class Tag {
	    id: string;
	    name: string;
	    description: string;
	    color: string;
	    group_id: string;
	    use_count: number;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    // Go type: time
	    last_used_at: any;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.color = source["color"];
	        this.group_id = source["group_id"];
	        this.use_count = source["use_count"];
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
	export class ClipboardItem {
	    id: string;
	    content: string;
	    content_type: string;
	    title: string;
	    tags?: Tag[];
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
	        this.tags = this.convertValues(source["tags"], Tag);
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
	    tag_mode: string;
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
	        this.tag_mode = source["tag_mode"];
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
	
	export class TagGroup {
	    id: string;
	    name: string;
	    description: string;
	    color: string;
	    sort_order: number;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	
	    static createFrom(source: any = {}) {
	        return new TagGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.color = source["color"];
	        this.sort_order = source["sort_order"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
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
	export class TagSearchQuery {
	    query: string;
	    group_id: string;
	    sort_by: string;
	    sort_order: string;
	    limit: number;
	    offset: number;
	
	    static createFrom(source: any = {}) {
	        return new TagSearchQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.group_id = source["group_id"];
	        this.sort_by = source["sort_by"];
	        this.sort_order = source["sort_order"];
	        this.limit = source["limit"];
	        this.offset = source["offset"];
	    }
	}
	
	export class TagWithStats {
	    id: string;
	    name: string;
	    description: string;
	    color: string;
	    group_id: string;
	    use_count: number;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    // Go type: time
	    last_used_at: any;
	    item_count: number;
	
	    static createFrom(source: any = {}) {
	        return new TagWithStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.color = source["color"];
	        this.group_id = source["group_id"];
	        this.use_count = source["use_count"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.last_used_at = this.convertValues(source["last_used_at"], null);
	        this.item_count = source["item_count"];
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
	export class TagStatistics {
	    total_tags: number;
	    most_used_tags: TagWithStats[];
	    recent_tags: TagWithStats[];
	    tag_groups: TagGroup[];
	    unused_tags: Tag[];
	
	    static createFrom(source: any = {}) {
	        return new TagStatistics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total_tags = source["total_tags"];
	        this.most_used_tags = this.convertValues(source["most_used_tags"], TagWithStats);
	        this.recent_tags = this.convertValues(source["recent_tags"], TagWithStats);
	        this.tag_groups = this.convertValues(source["tag_groups"], TagGroup);
	        this.unused_tags = this.convertValues(source["unused_tags"], Tag);
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

