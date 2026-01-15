// Azure DevOps API Integration

let AZURE_BASE_URL = 'https://azure.2p.com.sa/';
let AZURE_COLLECTION = 'Projects';
let AZURE_PROJECT = 'MOHU';
let AZURE_PAT = '';

/**
 * Set Azure Configuration
 */
export const setAzureConfig = (config) => {
  if (config.baseUrl) AZURE_BASE_URL = config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/';
  if (config.collection) AZURE_COLLECTION = config.collection;
  if (config.project) AZURE_PROJECT = config.project;

  localStorage.setItem('azure_config', JSON.stringify({ baseUrl: AZURE_BASE_URL, collection: AZURE_COLLECTION, project: AZURE_PROJECT }));
};

/**
 * Get Azure Configuration
 */
export const getAzureConfig = () => {
  const stored = localStorage.getItem('azure_config');
  if (stored) {
    try {
      const config = JSON.parse(stored);
      AZURE_BASE_URL = config.baseUrl || AZURE_BASE_URL;
      AZURE_COLLECTION = config.collection || AZURE_COLLECTION;
      AZURE_PROJECT = config.project || AZURE_PROJECT;
    } catch (e) {
      console.error('Failed to parse Azure config:', e);
    }
  }

  return {
    baseUrl: AZURE_BASE_URL,
    collection: AZURE_COLLECTION,
    project: AZURE_PROJECT,
  };
};

/**
 * Set Azure PAT Token
 */
export const setAzurePAT = (token) => {
  AZURE_PAT = token;
  localStorage.setItem('azure_pat', token);
};

/**
 * Get Azure PAT Token from localStorage
 */
export const getAzurePAT = () => {
  if (AZURE_PAT) return AZURE_PAT;
  const stored = localStorage.getItem('azure_pat');
  if (stored) {
    AZURE_PAT = stored;
  }
  return AZURE_PAT;
};

/**
 * Get all projects from Azure DevOps
 */
export const getAzureProjects = async () => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured');
    }

    const config = getAzureConfig();
    // URL للحصول على جميع المشاريع في Collection
    const url = `${config.baseUrl}${config.collection}/_apis/projects?api-version=5.1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch projects: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // تحويل البيانات إلى الشكل المطلوب
    return (data.value || []).map(proj => ({
      id: proj.name,
      name: proj.name,
      description: proj.description || '',
    }));
  } catch (err) {
    console.error('Failed to fetch Azure projects:', err);
    throw err;
  }
};

/**
 * Test Azure DevOps connection
 */
export const testAzureConnection = async () => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      return { success: false, error: 'PAT token not configured' };
    }

    const config = getAzureConfig();
    // اختبار الاتصال بجلب معلومات Collection
    const url = `${config.baseUrl}${config.collection}/_apis/projects?api-version=5.1&$top=1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Connection failed: ${response.status} - ${errorText}`
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Connection test failed'
    };
  }
};

/**
 * Make Azure API call with authentication
 */
const makeAzureRequest = async (endpoint, method = 'GET', body = null) => {
  const pat = getAzurePAT();
  if (!pat) {
    throw new Error('Azure PAT token not configured. Please set it in Azure Settings (Settings > PAT).');
  }

  const config = getAzureConfig();
  const url = `${config.baseUrl}${config.collection}/${config.project}/_apis${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(`:${pat}`),
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Azure API Error:', err);
    throw err;
  }
};

/**
 * Get all iterations (Epics equivalent in Azure)
 */
export const getAzureIterations = async () => {
  try {
    const response = await makeAzureRequest('/work/teamsettings/iterations?api-version=5.1');
    return response.value || [];
  } catch (err) {
    console.error('Failed to fetch iterations:', err);
    throw err;
  }
};

/**
 * Get area paths (Features equivalent in Azure)
 */
export const getAzureAreaPaths = async () => {
  try {
    const response = await makeAzureRequest('/wit/classificationnodes/areas?$depth=3&api-version=5.1');

    // Convert tree structure to flat list
    const areas = [];
    const traverse = (node, parent = '') => {
      if (node.name && node.name !== 'MOHU') {
        areas.push({
          id: node.path || node.name,
          name: node.name,
          path: node.path,
          fullPath: parent ? `${parent}\\${node.name}` : node.name,
        });
      }
      if (node.children) {
        node.children.forEach(child => {
          traverse(child, node.path || node.name);
        });
      }
    };

    if (response.children) {
      response.children.forEach(child => traverse(child));
    }

    return areas;
  } catch (err) {
    console.error('Failed to fetch area paths:', err);
    throw err;
  }
};

/**
 * Get work items by area path (Features)
 */
export const getAzureWorkItemsByArea = async (areaPath) => {
  try {
    const wiql = {
      query: `
        SELECT [System.Id], [System.Title], [System.State], [System.AreaPath]
        FROM WorkItems
        WHERE [System.TeamProject] = '@project'
        AND [System.AreaPath] UNDER '${areaPath}'
        AND [System.WorkItemType] = 'Feature'
        ORDER BY [System.ChangedDate] DESC
      `
    };

    const response = await makeAzureRequest('/wit/wiql?api-version=5.1', 'POST', wiql);
    return response.workItems || [];
  } catch (err) {
    console.error('Failed to fetch work items:', err);
    throw err;
  }
};

/**
 * Create a new User Story in Azure DevOps
 */
export const createAzureUserStory = async (storyData) => {
  try {
    const {
      title,
      description,
      acceptanceCriteria = [],
      priority = '2',
      areaPath,
      iterationPath,
      parentFeatureId,
      tags = '',
    } = storyData;

    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured.');
    }

    const config = getAzureConfig();

    // Detect the correct work item type for stories
    const storyType = await detectStoryWorkItemType();
    const encodedType = encodeURIComponent(storyType);
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/$${encodedType}?api-version=5.1`;

    const body = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: title,
      },
      {
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.Priority',
        value: priority,
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: `${description || title}\n\n---\nCreated by PAT System | All rights reserved © PAT System`,
      },
    ];

    // Add Acceptance Criteria in separate field
    if (acceptanceCriteria.length > 0) {
      const criteriaText = acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
      body.push({
        op: 'add',
        path: '/fields/Microsoft.VSTS.Common.AcceptanceCriteria',
        value: criteriaText,
      });
    }

    // Add Tags if provided
    if (tags && tags.trim()) {
      body.push({
        op: 'add',
        path: '/fields/System.Tags',
        value: tags.trim(),
      });
    }

    // Link to parent Feature if provided
    if (parentFeatureId) {
      body.push({
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'System.LinkTypes.Hierarchy-Reverse',
          url: `${config.baseUrl}${config.collection}/_apis/wit/workItems/${parentFeatureId}`,
          attributes: {
            comment: 'Parent Feature link'
          }
        }
      });
    } else if (areaPath) {
      // Fallback to AreaPath if no parent link
      body.push({
        op: 'add',
        path: '/fields/System.AreaPath',
        value: areaPath,
      });
    }

    if (iterationPath) {
      body.push({
        op: 'add',
        path: '/fields/System.IterationPath',
        value: iterationPath,
      });
    }

    const headers = {
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return {
      id: result.id,
      url: result.url,
      title: result.fields['System.Title'],
    };
  } catch (err) {
    console.error('Failed to create user story:', err);
    throw err;
  }
};

/**
 * Create new Epic in Azure DevOps
 */
export const createAzureEpic = async (epicName) => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured. Please set it in Settings.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/$Epic?api-version=5.1`;

    const body = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: epicName,
      },
    ];

    const headers = {
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return {
      id: result.id.toString(),
      name: result.fields['System.Title'],
      path: result.fields['System.AreaPath'] || config.project,
    };
  } catch (err) {
    console.error('Failed to create Epic:', err);
    throw err;
  }
};

/**
 * Create new Feature in Azure DevOps
 */
export const createAzureFeature = async (featureName, parentEpicId = null) => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured. Please set it in Settings.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/$Feature?api-version=5.1`;

    const body = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: featureName,
      },
    ];

    // Link to parent Epic if provided
    if (parentEpicId) {
      body.push({
        op: 'add',
        path: '/relations/-',
        value: {
          rel: 'System.LinkTypes.Hierarchy-Reverse',
          url: `${config.baseUrl}${config.collection}/_apis/wit/workItems/${parentEpicId}`,
          attributes: {
            comment: 'Parent Epic link'
          }
        }
      });
    }

    const headers = {
      'Content-Type': 'application/json-patch+json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return {
      id: result.id.toString(),
      name: result.fields['System.Title'],
      path: result.fields['System.AreaPath'] || config.project,
    };
  } catch (err) {
    console.error('Failed to create Feature:', err);
    throw err;
  }
};

/**
 * Get available Work Item Types for the project
 */
export const getWorkItemTypes = async () => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitemtypes?api-version=5.1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch work item types: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return result.value.map(wit => ({
      name: wit.name,
      referenceName: wit.referenceName,
      description: wit.description,
    }));
  } catch (err) {
    console.error('Failed to get work item types:', err);
    return [];
  }
};

/**
 * Detect the correct story work item type (User Story, Product Backlog Item, or Issue)
 */
let cachedStoryType = null;
export const detectStoryWorkItemType = async () => {
  if (cachedStoryType) return cachedStoryType;

  try {
    const workItemTypes = await getWorkItemTypes();
    const typeNames = workItemTypes.map(wit => wit.name);

    // Priority order: User Story (Agile) > Product Backlog Item (Scrum) > Issue (Basic)
    if (typeNames.includes('User Story')) {
      cachedStoryType = 'User Story';
    } else if (typeNames.includes('Product Backlog Item')) {
      cachedStoryType = 'Product Backlog Item';
    } else if (typeNames.includes('Issue')) {
      cachedStoryType = 'Issue';
    } else {
      cachedStoryType = 'User Story'; // fallback
    }

    console.log('Detected story work item type:', cachedStoryType);
    return cachedStoryType;
  } catch (err) {
    console.error('Failed to detect story type, using User Story as fallback:', err);
    return 'User Story';
  }
};

/**
 * Get existing Epics from Azure DevOps
 */
export const getExistingEpics = async () => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured. Please click the "PAT" button to set your token.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/wiql?api-version=5.1`;

    const wiqlQuery = {
      query: `SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.TeamProject] = '${config.project}' AND [System.WorkItemType] = 'Epic' ORDER BY [System.ChangedDate] DESC`
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(wiqlQuery),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Epics: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (!result.workItems || result.workItems.length === 0) {
      return [];
    }

    // Get full details for each Epic
    const ids = result.workItems.map(wi => wi.id).join(',');
    const detailsUrl = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems?ids=${ids}&api-version=5.1`;

    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers,
    });

    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch Epic details');
    }

    const details = await detailsResponse.json();

    return details.value.map(item => ({
      id: item.id.toString(),
      name: item.fields['System.Title'],
      path: item.fields['System.AreaPath'] || config.project,
    }));
  } catch (err) {
    console.error('Failed to get existing Epics:', err);
    throw err;
  }
};

/**
 * Get existing Features under a specific Epic
 */
export const getExistingFeatures = async (epicId) => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured. Please set your token via the "PAT" button.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/${epicId}?$expand=relations&api-version=5.1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Epic: ${response.status} - ${error}`);
    }

    const epic = await response.json();

    if (!epic.relations || epic.relations.length === 0) {
      return [];
    }

    // Filter child Features
    const childLinks = epic.relations.filter(rel =>
      rel.rel === 'System.LinkTypes.Hierarchy-Forward'
    );

    if (childLinks.length === 0) {
      return [];
    }

    // Get details for each child
    const features = [];
    for (const link of childLinks) {
      const childId = link.url.split('/').pop();
      const childUrl = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/${childId}?api-version=5.1`;

      const childResponse = await fetch(childUrl, {
        method: 'GET',
        headers,
      });

      if (childResponse.ok) {
        const child = await childResponse.json();
        if (child.fields['System.WorkItemType'] === 'Feature') {
          features.push({
            id: child.id.toString(),
            name: child.fields['System.Title'],
            path: child.fields['System.AreaPath'] || config.project,
          });
        }
      }
    }

    return features;
  } catch (err) {
    console.error('Failed to get existing Features:', err);
    throw err;
  }
};

/**
 * Get Work Item by ID (for Pull from Azure)
 */
export const getWorkItemById = async (workItemId) => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/${workItemId}?$expand=relations&api-version=5.1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Work item not found: ${response.status}`);
    }

    const result = await response.json();

    return {
      id: result.id.toString(),
      type: result.fields['System.WorkItemType'],
      title: result.fields['System.Title'],
      description: result.fields['System.Description'] || '',
      state: result.fields['System.State'] || 'New',
      priority: result.fields['Microsoft.VSTS.Common.Priority'] || 'Not Set',
      acceptanceCriteria: result.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
      tags: result.fields['System.Tags'] || '',
      relations: result.relations || [],
    };
  } catch (err) {
    console.error('Failed to get work item:', err);
    throw err;
  }
};

/**
 * Get child work items (for Epic/Feature)
 */
export const getWorkItemChildren = async (workItemId) => {
  try {
    const pat = getAzurePAT();
    if (!pat) {
      throw new Error('Azure PAT token not configured.');
    }

    const config = getAzureConfig();
    const url = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/${workItemId}?$expand=relations&api-version=5.1`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`:${pat}`),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch work item');
    }

    const result = await response.json();

    if (!result.relations || result.relations.length === 0) {
      return [];
    }

    // Filter child items (Hierarchy-Forward relations)
    const childLinks = result.relations.filter(rel =>
      rel.rel === 'System.LinkTypes.Hierarchy-Forward'
    );

    if (childLinks.length === 0) {
      return [];
    }

    // Get details for each child
    const children = [];
    for (const link of childLinks) {
      const childId = link.url.split('/').pop();
      const childUrl = `${config.baseUrl}${config.collection}/${config.project}/_apis/wit/workitems/${childId}?api-version=5.1`;

      const childResponse = await fetch(childUrl, {
        method: 'GET',
        headers,
      });

      if (childResponse.ok) {
        const child = await childResponse.json();
        children.push({
          id: child.id.toString(),
          type: child.fields['System.WorkItemType'],
          title: child.fields['System.Title'],
          state: child.fields['System.State'] || 'New',
          priority: child.fields['Microsoft.VSTS.Common.Priority'] || 'Not Set',
        });
      }
    }

    return children;
  } catch (err) {
    console.error('Failed to get work item children:', err);
    return [];
  }
};

/**
 * Get hierarchy of projects/iterations/areas (for UI dropdowns)
 */
export const getAzureHierarchy = async () => {
  try {
    const areas = await getAzureAreaPaths();
    const iterations = await getAzureIterations();

    // Organize areas by hierarchy
    const hierarchyMap = {};
    areas.forEach(area => {
      const parts = area.path ? area.path.split('\\') : [];
      if (parts.length >= 2) {
        const epic = parts[0];
        const feature = parts.slice(1).join('\\');

        if (!hierarchyMap[epic]) {
          hierarchyMap[epic] = [];
        }

        hierarchyMap[epic].push({
          id: area.id,
          name: area.name,
          path: area.path,
        });
      }
    });

    return {
      epics: Object.keys(hierarchyMap).map(name => ({
        id: name,
        name: name,
      })),
      features: hierarchyMap,
      iterations: iterations.map(iter => ({
        id: iter.id,
        name: iter.name,
        path: iter.path,
      })),
    };
  } catch (err) {
    console.error('Failed to get Azure hierarchy:', err);
    throw err;
  }
};

/**
 * Bulk push multiple User Stories to Azure DevOps
 * @param {Array} stories - Array of stories to push
 * @param {Object} options - Push options (epicId, featureId, tags, etc.)
 * @param {Function} onProgress - Progress callback (current, total, story, result)
 * @returns {Object} - Results with success/failed arrays
 */
export const bulkPushToAzure = async (stories, options = {}, onProgress = null) => {
  const {
    epicId,
    featureId,
    tags = '',
    createEpicIfNeeded = false,
    newEpicName = '',
    createFeatureIfNeeded = false,
    newFeatureName = '',
  } = options;

  const results = {
    success: [],
    failed: [],
    total: stories.length,
    epicId: null,
    featureId: null,
    epicName: '',
    featureName: '',
  };

  if (stories.length === 0) {
    return results;
  }

  try {
    // Step 1: Create or use Epic
    let targetEpicId = epicId;
    let targetEpicName = '';

    if (createEpicIfNeeded && newEpicName.trim()) {
      try {
        const newEpic = await createAzureEpic(newEpicName);
        targetEpicId = newEpic.id;
        targetEpicName = newEpic.name;
        results.epicId = targetEpicId;
        results.epicName = targetEpicName;
      } catch (epicErr) {
        throw new Error(`Failed to create Epic "${newEpicName}": ${epicErr.message}`);
      }
    } else if (epicId) {
      results.epicId = epicId;
    }

    // Step 2: Create or use Feature
    let targetFeatureId = featureId;
    let targetFeatureName = '';

    if (createFeatureIfNeeded && newFeatureName.trim()) {
      try {
        const newFeature = await createAzureFeature(newFeatureName, targetEpicId);
        targetFeatureId = newFeature.id;
        targetFeatureName = newFeature.name;
        results.featureId = targetFeatureId;
        results.featureName = targetFeatureName;
      } catch (featureErr) {
        throw new Error(`Failed to create Feature "${newFeatureName}": ${featureErr.message}`);
      }
    } else if (featureId) {
      results.featureId = featureId;
    }

    // Step 3: Push each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];

      try {
        // Skip if already has Azure Work Item ID
        if (story.azure_work_item_id && story.azure_work_item_id.trim() !== '') {
          if (onProgress) {
            onProgress(i + 1, stories.length, story, {
              success: false,
              skipped: true,
              message: 'Already linked to Azure'
            });
          }
          results.failed.push({
            story,
            error: 'Already linked to Azure',
            skipped: true,
          });
          continue;
        }

        // Parse acceptance criteria
        let acceptanceCriteria = [];
        if (story.acceptance_criteria) {
          if (Array.isArray(story.acceptance_criteria)) {
            acceptanceCriteria = story.acceptance_criteria;
          } else if (typeof story.acceptance_criteria === 'string') {
            try {
              acceptanceCriteria = JSON.parse(story.acceptance_criteria);
            } catch {
              acceptanceCriteria = story.acceptance_criteria
                .split('\n')
                .map(c => c.trim())
                .filter(c => c && !c.startsWith('---'));
            }
          }
        }

        // Convert priority (P1/P2/P3 -> 1/2/3)
        let priority = '3';
        if (story.priority === 'P1') priority = '1';
        else if (story.priority === 'P2') priority = '2';

        // Create user story in Azure
        const azureStory = await createAzureUserStory({
          title: story.title,
          description: story.description || '',
          acceptanceCriteria,
          priority,
          areaPath: '',
          parentFeatureId: targetFeatureId,
          tags,
        });

        results.success.push({
          story,
          workItemId: azureStory.id,
          url: azureStory.url,
        });

        if (onProgress) {
          onProgress(i + 1, stories.length, story, {
            success: true,
            workItemId: azureStory.id
          });
        }

        // Small delay to avoid rate limiting
        if (i < stories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (storyErr) {
        results.failed.push({
          story,
          error: storyErr.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, stories.length, story, {
            success: false,
            error: storyErr.message
          });
        }
      }
    }

    return results;

  } catch (err) {
    // Critical error (Epic/Feature creation failed)
    throw err;
  }
};

