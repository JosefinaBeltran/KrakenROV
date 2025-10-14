const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'frontend',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createNewProjectRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewProject');
}
createNewProjectRef.operationName = 'CreateNewProject';
exports.createNewProjectRef = createNewProjectRef;

exports.createNewProject = function createNewProject(dc) {
  return executeMutation(createNewProjectRef(dc));
};

const listAllProjectsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllProjects');
}
listAllProjectsRef.operationName = 'ListAllProjects';
exports.listAllProjectsRef = listAllProjectsRef;

exports.listAllProjects = function listAllProjects(dc) {
  return executeQuery(listAllProjectsRef(dc));
};

const updateInspectionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInspectionStatus', inputVars);
}
updateInspectionStatusRef.operationName = 'UpdateInspectionStatus';
exports.updateInspectionStatusRef = updateInspectionStatusRef;

exports.updateInspectionStatus = function updateInspectionStatus(dcOrVars, vars) {
  return executeMutation(updateInspectionStatusRef(dcOrVars, vars));
};

const getMediaAssetsByInspectionIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMediaAssetsByInspectionId', inputVars);
}
getMediaAssetsByInspectionIdRef.operationName = 'GetMediaAssetsByInspectionId';
exports.getMediaAssetsByInspectionIdRef = getMediaAssetsByInspectionIdRef;

exports.getMediaAssetsByInspectionId = function getMediaAssetsByInspectionId(dcOrVars, vars) {
  return executeQuery(getMediaAssetsByInspectionIdRef(dcOrVars, vars));
};
