import Component from '../models/Component.js';
import { generateComponent } from '../utils/aiGenerator.js';
import { generateComponentZip, sendZipResponse } from '../utils/zipGenerator.js';
import mongoose from 'mongoose';

// Constants
const MAX_COMPONENTS_PER_USER = 100;
const MIN_PROMPT_LENGTH = 2;
const MIN_UPDATE_PROMPT_LENGTH = 5;

// Helper function to format responses
const formatComponentResponse = (component) => ({
  _id: component._id,
  name: component.name,
  type: component.type,
  presetType: component.presetType,
  jsxCode: component.jsxCode,
  cssCode: component.cssCode,
  testCode: component.testCode,
  storybookCode: component.storybookCode,
  createdAt: component.createdAt,
  updatedAt: component.updatedAt,
  versions: component.versions?.length || 0
});

// Main Controller Methods
export const createComponent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, prompt, preset = 'REACT' } = req.body;

    // Validation
    if (!prompt || prompt.trim().length < MIN_PROMPT_LENGTH) {
      return res.status(400).json({ 
        message: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters` 
      });
    }

    if (!['REACT', 'MUI'].includes(preset)) {
      return res.status(400).json({ 
        message: 'Invalid preset. Must be REACT or MUI' 
      });
    }

    const count = await Component.countDocuments({ user: userId });
    if (count >= MAX_COMPONENTS_PER_USER) {
      return res.status(400).json({
        message: `Component limit reached (max ${MAX_COMPONENTS_PER_USER})`
      });
    }

    // Generate component with AI
    const { 
      jsxCode, 
      cssCode, 
      testCode, 
      storybookCode, 
      componentName,
      aiResponse
    } = await generateComponent(prompt, '', '', preset);

    // Save to database
    const component = await new Component({
      user: userId,
      name: name || componentName,
      type: 'custom',
      jsxCode,
      cssCode,
      testCode,
      storybookCode,
      presetType: preset,
      chatHistory: [{
        role: 'user',
        content: prompt
      }, {
        role: 'ai',
        content: aiResponse
      }]
    }).save();

    res.status(201).json({
      ...formatComponentResponse(component),
      message: 'Component created successfully'
    });

  } catch (error) {
    console.error('Create component error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create component'
    });
  }
};

export const updateComponent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { prompt, preset = 'REACT' } = req.body;

    if (!prompt || prompt.trim().length < MIN_UPDATE_PROMPT_LENGTH) {
      return res.status(400).json({ 
        message: `Prompt must be at least ${MIN_UPDATE_PROMPT_LENGTH} characters` 
      });
    }

    const existing = await Component.findOne({ _id: id, user: userId });
    if (!existing) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Generate updated component
    const { 
      jsxCode, 
      cssCode, 
      testCode, 
      storybookCode, 
      aiResponse 
    } = await generateComponent(
      prompt,
      existing.jsxCode,
      existing.cssCode,
      preset
    );

    // Create version snapshot
    const version = {
      jsxCode: existing.jsxCode,
      cssCode: existing.cssCode,
      testCode: existing.testCode,
      storybookCode: existing.storybookCode,
      createdAt: existing.updatedAt
    };

    // Update component
    const updated = await Component.findOneAndUpdate(
      { _id: id, user: userId },
      {
        jsxCode,
        cssCode,
        testCode,
        storybookCode,
        presetType: preset,
        $push: { 
          versions: version,
          chatHistory: [
            { role: 'user', content: prompt },
            { role: 'ai', content: aiResponse }
          ]
        }
      },
      { new: true }
    );

    res.json({
      ...formatComponentResponse(updated),
      message: 'Component updated successfully'
    });

  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update component'
    });
  }
};

export const getComponents = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10, search = '', type } = req.query;

    const query = { 
      user: userId,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'chatHistory.content': { $regex: search, $options: 'i' } }
        ]
      }),
      ...(type && { type })
    };

    const [components, total] = await Promise.all([
      Component.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('_id name type presetType createdAt updatedAt versions'),
      Component.countDocuments(query)
    ]);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      components: components.map(formatComponentResponse)
    });

  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch components'
    });
  }
};

export const getComponent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { codeOnly } = req.query;

    const component = await Component.findOne(
      { _id: id, user: userId },
      codeOnly ? 'jsxCode cssCode testCode storybookCode' : ''
    );

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json(formatComponentResponse(component));

  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch component'
    });
  }
};

export const getVersions = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const component = await Component.findOne(
      { _id: id, user: userId },
      { versions: 1 }
    );

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json({
      versions: component.versions.map(version => ({
        jsxCode: version.jsxCode,
        cssCode: version.cssCode,
        testCode: version.testCode,
        storybookCode: version.storybookCode,
        createdAt: version.createdAt
      }))
    });

  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch versions'
    });
  }
};

export const deleteComponent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const component = await Component.findOneAndDelete({ _id: id, user: userId });
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json({ 
      message: 'Component deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete component'
    });
  }
};

export const exportComponent = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const component = await Component.findOne({ _id: id, user: userId });
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    const zipBuffer = await generateComponentZip(component);
    sendZipResponse(res, zipBuffer, component.name);

  } catch (error) {
    console.error('Export component error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to export component'
    });
  }
};

export const restoreVersion = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id, versionId } = req.params;

    const component = await Component.findOne({ _id: id, user: userId });
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    const version = component.versions.id(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Create new version before restoring
    const newVersion = {
      jsxCode: component.jsxCode,
      cssCode: component.cssCode,
      testCode: component.testCode,
      storybookCode: component.storybookCode
    };

    // Restore the version
    component.jsxCode = version.jsxCode;
    component.cssCode = version.cssCode;
    component.testCode = version.testCode;
    component.storybookCode = version.storybookCode;
    component.versions.push(newVersion);

    await component.save();

    res.json({
      ...formatComponentResponse(component),
      message: 'Version restored successfully'
    });

  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to restore version'
    });
  }
};

export default {
  createComponent,
  updateComponent,
  getComponents,
  getComponent,
  getVersions,
  deleteComponent,
  exportComponent,
  restoreVersion
};