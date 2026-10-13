import { z } from "zod";
export const roadmapInput=z.object({idea:z.string().trim().min(20,"Describe your idea in at least 20 characters.").max(12000),stack:z.string().trim().min(2).max(300),visualStyle:z.string().trim().max(100).optional().default("Inter + Clean"),deviceSupport:z.string().trim().max(100).optional().default("Desktop + Mobile")});
export const auditInput=z.object({code:z.string().min(20,"Paste enough code to analyse.").max(30000),filename:z.string().trim().max(160).optional(),projectId:z.string().uuid().optional()});

export const docsInput=z.object({
  projectName:z.string().trim().max(120,"Project name must be 120 characters or fewer.").optional().default(""),
  source:z.string().trim().min(40,"Paste project files or code with at least 40 characters.").max(45000,"Project input is too large. Keep the combined source under 45,000 characters."),
});
