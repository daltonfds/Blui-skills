import { z } from "zod";
export const roadmapInput=z.object({idea:z.string().trim().min(20,"Describe your idea in at least 20 characters.").max(12000),stack:z.string().trim().min(2).max(300)});
export const auditInput=z.object({code:z.string().min(20,"Paste enough code to analyse.").max(30000),filename:z.string().trim().max(160).optional(),projectId:z.string().uuid().optional()});
