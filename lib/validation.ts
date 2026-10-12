import { z } from "zod";
export const roadmapInput=z.object({idea:z.string().trim().min(20,"Descreve a ideia com pelo menos 20 caracteres.").max(12000),stack:z.string().trim().min(2).max(300)});
export const auditInput=z.object({code:z.string().min(20,"Cola código suficiente para analisar.").max(30000),filename:z.string().trim().max(160).optional(),projectId:z.string().uuid().optional()});
