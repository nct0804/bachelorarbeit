import express from 'express';
import * as VocabularyController from './vocabulary.controller';
import { authenticate, checkRole } from '../../middleware/auth.middleware';
import { handleError } from '../../utils/errors';

const router = express.Router();

// PUBLIC ROUTES - Accessible without authentication -- ############

// Get all sound groups GET /api/vocabulary/groups
router.get('/groups', async (req, res) => {
  try {
    await VocabularyController.getAllSoundGroups(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// Get a sound group by ID GET /api/vocabulary/groups/:id
router.get('/groups/:id', async (req, res) => {
  try {
    await VocabularyController.getSoundGroupById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// Get all sounds with optional filtering GET /api/vocabulary/sounds
router.get('/sounds', async (req, res) => {
  try {
    await VocabularyController.getAllSounds(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

// GET /api/vocabulary/sounds/:id Get a sound by ID
router.get('/sounds/:id', async (req, res) => {
  try {
    await VocabularyController.getSoundById(req, res);
  } catch (error) {
    handleError(error, res);
  }
});

//  ADMIN ROUTES - Requires authentication and admin role -- ############

// Create a new sound group POST /api/vocabulary/groups
router.post( '/groups', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.createSoundGroup(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Update a sound group PUT /api/vocabulary/groups/:id
router.put( '/groups/:id', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.updateSoundGroup(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Delete a sound group DELETE /api/vocabulary/groups/:id
router.delete( '/groups/:id', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.deleteSoundGroup(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Create a new sound - POST /api/vocabulary/sounds
router.post( '/sounds', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.createSound(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Update a sound, PUT /api/vocabulary/sounds/:id
router.put( '/sounds/:id', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.updateSound(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

//  DELETE /api/vocabulary/sounds/:id Delete a sound
router.delete( '/sounds/:id', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.deleteSound(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Add a sound to a group POST /api/vocabulary/sounds/:soundId/groups/:groupId
router.post( '/sounds/:soundId/groups/:groupId', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.addSoundToGroup(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

// Remove a sound from a group DELETE /api/vocabulary/sounds/:soundId/groups/:groupId
router.delete( '/sounds/:soundId/groups/:groupId', authenticate, checkRole(['admin']),
  async (req, res) => {
    try {
      await VocabularyController.removeSoundFromGroup(req, res);
    } catch (error) {
      handleError(error, res);
    }
  }
);

export default router;