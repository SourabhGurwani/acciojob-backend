import Joi from 'joi';

export const createComponentSchema = Joi.object({
  name: Joi.string().max(50).required(),
  prompt: Joi.string().min(10).max(1000).required()
});

export const updateComponentSchema = Joi.object({
  prompt: Joi.string().min(5).max(1000).required()
});