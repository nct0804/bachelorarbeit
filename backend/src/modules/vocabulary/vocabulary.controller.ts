import { Request, Response } from 'express';
import * as VocabularyService from './vocabulary.service';
import { BadRequestError } from '../../utils/errors';

// GET /api/vocabulary/groups
export const getAllSoundGroups = async (req: Request, res: Response) => {
    const soundGroups = await VocabularyService.getAllSoundGroups();
    
    return res.status(200).json({
      success: true,
      data: soundGroups
    });
};

// GET /api/vocabulary/groups/:id
export const getSoundGroupById = async (req: Request, res: Response) => {
    const groupId = Number(req.params.id);
    
    if (isNaN(groupId)) {
      throw new BadRequestError('Invalid group ID');
    }
    
    const soundGroup = await VocabularyService.getSoundGroupById(groupId);
    
    return res.status(200).json({
      success: true,
      data: soundGroup
    });
};

// GET /api/vocabulary/sounds
export const getAllSounds = async (req: Request, res: Response) => {
    const { type } = req.query;
    const sounds = await VocabularyService.getAllSounds(type as any);
    
    return res.status(200).json({
      success: true,
      data: sounds
    });
};

// GET /api/vocabulary/sounds/:id
export const getSoundById = async (req: Request, res: Response) => {
    const soundId = Number(req.params.id);
    
    if (isNaN(soundId)) {
      throw new BadRequestError('Invalid sound ID');
    }
    
    const sound = await VocabularyService.getSoundById(soundId);
    
    return res.status(200).json({
      success: true,
      data: sound
    });
};

// POST /api/vocabulary/groups
export const createSoundGroup = async (req: Request, res: Response) => {
    const { name, order } = req.body;
    
    if (!name) {
      throw new BadRequestError('Group name is required');
    }
    
    const newSoundGroup = await VocabularyService.createSoundGroup({
      name,
      order: order || 1
    });
    
    return res.status(201).json({
      success: true,
      data: newSoundGroup
    });

};

// POST /api/vocabulary/sounds
export const createSound = async (req: Request, res: Response) => {
    const { symbol, exampleWord, type, audioSrc, groupIds } = req.body;
    
    if (!symbol || !exampleWord || !type) {
      throw new BadRequestError('Symbol, example word, and type are required');
    }
    
    const newSound = await VocabularyService.createSound({
      symbol,
      exampleWord,
      type,
      audioSrc: audioSrc || '',
      groupIds
    });
    
    return res.status(201).json({
      success: true,
      data: newSound
    });
};

// PUT /api/vocabulary/sounds/:id
export const updateSound = async (req: Request, res: Response) => {
    const soundId = Number(req.params.id);
    
    if (isNaN(soundId)) {
      throw new BadRequestError('Invalid sound ID');
    }
    
    const { symbol, exampleWord, type, audioSrc, groupIds } = req.body;
    
    const updatedSound = await VocabularyService.updateSound(soundId, {
      symbol,
      exampleWord,
      type,
      audioSrc,
      groupIds
    });
    
    return res.status(200).json({
      success: true,
      data: updatedSound
    });
};

// DELETE /api/vocabulary/sounds/:id
export const deleteSound = async (req: Request, res: Response) => {
    const soundId = Number(req.params.id);
    
    if (isNaN(soundId)) {
      throw new BadRequestError('Invalid sound ID');
    }
    
    await VocabularyService.deleteSound(soundId);
    
    return res.status(200).json({
      success: true,
      message: `Sound with ID ${soundId} successfully deleted`
    });
};

// PUT /api/vocabulary/groups/:id
export const updateSoundGroup = async (req: Request, res: Response) => {
    const groupId = Number(req.params.id);
    
    if (isNaN(groupId)) {
      throw new BadRequestError('Invalid group ID');
    }
    
    const { name, order } = req.body;
    
    const updatedGroup = await VocabularyService.updateSoundGroup(groupId, {
      name,
      order
    });
    
    return res.status(200).json({
      success: true,
      data: updatedGroup
    });
};

//DELETE /api/vocabulary/groups/:id
export const deleteSoundGroup = async (req: Request, res: Response) => {
    const groupId = Number(req.params.id);
    
    if (isNaN(groupId)) {
      throw new BadRequestError('Invalid group ID');
    }
    
    await VocabularyService.deleteSoundGroup(groupId);
    
    return res.status(200).json({
      success: true,
      message: `Sound group with ID ${groupId} successfully deleted`
    });
};

//POST /api/vocabulary/sounds/:soundId/groups/:groupId
export const addSoundToGroup = async (req: Request, res: Response) => {
    const soundId = Number(req.params.soundId);
    const groupId = Number(req.params.groupId);
    
    if (isNaN(soundId) || isNaN(groupId)) {
      throw new BadRequestError('Invalid sound ID or group ID');
    }
    
    const association = await VocabularyService.addSoundToGroup(soundId, groupId);
    
    return res.status(201).json({
      success: true,
      data: association
    });
};

// DELETE /api/vocabulary/sounds/:soundId/groups/:groupId
export const removeSoundFromGroup = async (req: Request, res: Response) => {
    const soundId = Number(req.params.soundId);
    const groupId = Number(req.params.groupId);
    
    if (isNaN(soundId) || isNaN(groupId)) {
      throw new BadRequestError('Invalid sound ID or group ID');
    }
    
    await VocabularyService.removeSoundFromGroup(soundId, groupId);
    
    return res.status(200).json({
      success: true,
      message: `Sound ${soundId} successfully removed from group ${groupId}`
    });
};