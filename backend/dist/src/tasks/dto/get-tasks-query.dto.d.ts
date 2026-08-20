import { TaskPriority, TaskStatus } from '../schemas/task.schema';
export declare enum SortByField {
    CREATED_AT = "createdAt",
    DUE_DATE = "dueDate",
    PRIORITY = "priority",
    TITLE = "title"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class GetTasksQueryDto {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: SortByField;
    sortOrder?: SortOrder;
}
