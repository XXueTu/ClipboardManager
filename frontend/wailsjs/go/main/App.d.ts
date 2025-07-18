// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {models} from '../models';

export function AddTagsToItem(arg1:string,arg2:Array<string>):Promise<void>;

export function AutoGenerateTags(arg1:string,arg2:string):Promise<Array<string>>;

export function BatchPermanentDelete(arg1:Array<string>):Promise<void>;

export function CleanupUnusedTags():Promise<void>;

export function CreateChatSession(arg1:string):Promise<models.ChatSession>;

export function CreateClipboardItem(arg1:string):Promise<void>;

export function CreateTag(arg1:string,arg2:string,arg3:string,arg4:string):Promise<models.Tag>;

export function CreateTagGroup(arg1:string,arg2:string,arg3:string,arg4:number):Promise<models.TagGroup>;

export function DeleteChatSession(arg1:string):Promise<void>;

export function DeleteClipboardItem(arg1:string):Promise<void>;

export function DeleteTag(arg1:string):Promise<void>;

export function DeleteTagGroup(arg1:string):Promise<void>;

export function EmptyTrash():Promise<void>;

export function GenerateChatTags(arg1:string):Promise<Array<string>>;

export function GenerateChatTitle(arg1:string):Promise<string>;

export function GenerateTagsForClipboardItem(arg1:string):Promise<Array<string>>;

export function GetCategoriesAndTags():Promise<models.CategoryTagsResponse>;

export function GetChatMessages(arg1:string,arg2:number,arg3:number):Promise<models.ChatMessageListResponse>;

export function GetChatSession(arg1:string):Promise<models.ChatSession>;

export function GetChatSessions():Promise<models.ChatSessionListResponse>;

export function GetClipboardItems(arg1:number,arg2:number):Promise<Array<models.ClipboardItem>>;

export function GetMostUsedTags(arg1:number):Promise<Array<models.TagWithStats>>;

export function GetRecentTags(arg1:number):Promise<Array<models.TagWithStats>>;

export function GetSettings():Promise<models.Settings>;

export function GetSimilarTags(arg1:string,arg2:number):Promise<Array<models.Tag>>;

export function GetStatistics():Promise<models.Statistics>;

export function GetTagGroups():Promise<Array<models.TagGroup>>;

export function GetTagStatistics():Promise<models.TagStatistics>;

export function GetTags():Promise<Array<models.Tag>>;

export function GetTagsByGroup(arg1:string):Promise<Array<models.Tag>>;

export function GetTagsForItem(arg1:string):Promise<Array<models.Tag>>;

export function GetTrashItems(arg1:number,arg2:number):Promise<Array<models.ClipboardItem>>;

export function GetWindowState():Promise<models.WindowState>;

export function HideWindow():Promise<void>;

export function MergeTags(arg1:string,arg2:string):Promise<void>;

export function PermanentDeleteClipboardItem(arg1:string):Promise<void>;

export function RemoveTagsFromItem(arg1:string,arg2:Array<string>):Promise<void>;

export function RestoreClipboardItem(arg1:string):Promise<void>;

export function SearchClipboardItems(arg1:models.SearchQuery):Promise<models.SearchResult>;

export function SearchTags(arg1:models.TagSearchQuery):Promise<Array<models.TagWithStats>>;

export function SendChatMessage(arg1:string,arg2:string):Promise<models.ChatMessage>;

export function SendChatMessageStream(arg1:string,arg2:string):Promise<void>;

export function SetScreenSize(arg1:number,arg2:number):Promise<void>;

export function ShowWindow():Promise<void>;

export function SuggestTags(arg1:string,arg2:number):Promise<Array<string>>;

export function ToggleWindow():Promise<void>;

export function UpdateChatSession(arg1:string,arg2:string):Promise<void>;

export function UpdateClipboardItem(arg1:models.ClipboardItem):Promise<void>;

export function UpdateItemTags(arg1:string,arg2:Array<string>,arg3:string):Promise<void>;

export function UpdateSettings(arg1:models.Settings):Promise<void>;

export function UpdateTag(arg1:models.Tag):Promise<void>;

export function UpdateTagGroup(arg1:models.TagGroup):Promise<void>;

export function UseClipboardItem(arg1:string):Promise<void>;
