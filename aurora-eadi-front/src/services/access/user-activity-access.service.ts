import { api } from "@/lib/api";
import { ActivitiesAccessResponse, ToggleActivityDto, BulkConfigureActivitiesDto, ActivityUsageStats } from "@/types/access-control";

export const userActivityAccessService = {
    async getActivitiesAccess(
        userId: string,
        moduleId: number
    ): Promise<ActivitiesAccessResponse> {
        const response = await api.get(
            `/user-activity-access/${userId}/${moduleId}/activities`
        );
        return response.data;
    },

    async toggleActivity(
        userId: string,
        moduleId: number,
        activityId: number,
        data: ToggleActivityDto
    ): Promise<{
        message: string;
        userActivityAccess: {
            id: number;
            activityId: number;
            activityName: string;
            moduleName: string;
            isEnabled: boolean;
            isMandatory: boolean;
        };
    }> {
        const response = await api.put(
            `/user-activity-access/${userId}/module/${moduleId}/activity/${activityId}`,
            data
        );
        return response.data;
    },

    async configureBulkActivities(
        userId: string,
        moduleId: number,
        data: BulkConfigureActivitiesDto
    ): Promise<{
        message: string;
        results: Array<{
            activityId: number;
            activityName: string;
            isEnabled: boolean;
            isMandatory: boolean;
        }>;
    }> {
        const response = await api.post(
            `/user-activity-access/${userId}/module/${moduleId}/bulk`,
            data
        );
        return response.data;
    },

    async removeActivityException(
        userId: string,
        moduleId: number,
        activityId: number
    ): Promise<{
        message: string;
        activity: {
            id: number;
            name: string;
            moduleName: string;
            isMandatory: boolean;
            defaultState: boolean;
        };
    }> {
        const response = await api.delete(
            `/user-activity-access/${userId}/${moduleId}/activity/${activityId}/exception`
        );
        return response.data;
    },

    async resetModuleActivities(
        userId: string,
        moduleId: number
    ): Promise<{
        message: string;
        deletedCount: number;
    }> {
        const response = await api.delete(
            `/user-activity-access/${userId}/${moduleId}/reset`
        );
        return response.data;
    },

    async getActivityUsageStats(
        moduleId?: number
    ): Promise<ActivityUsageStats[]> {
        const params = moduleId ? { moduleId } : {};
        const response = await api.get("/user-activity-access/stats/activities", {
            params,
        });
        return response.data;
    },
};
