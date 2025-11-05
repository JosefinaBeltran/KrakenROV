import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'frontend',
  location: 'us-central1'
};

export const createNewProjectRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewProject');
}
createNewProjectRef.operationName = 'CreateNewProject';

export function createNewProject(dc) {
  return executeMutation(createNewProjectRef(dc));
}

export const listAllProjectsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllProjects');
}
listAllProjectsRef.operationName = 'ListAllProjects';

export function listAllProjects(dc) {
  return executeQuery(listAllProjectsRef(dc));
}

export const updateInspectionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateInspectionStatus', inputVars);
}
updateInspectionStatusRef.operationName = 'UpdateInspectionStatus';

export function updateInspectionStatus(dcOrVars, vars) {
  return executeMutation(updateInspectionStatusRef(dcOrVars, vars));
}

export const getMediaAssetsByInspectionIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMediaAssetsByInspectionId', inputVars);
}
getMediaAssetsByInspectionIdRef.operationName = 'GetMediaAssetsByInspectionId';

export function getMediaAssetsByInspectionId(dcOrVars, vars) {
  return executeQuery(getMediaAssetsByInspectionIdRef(dcOrVars, vars));
}

