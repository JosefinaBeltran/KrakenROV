import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewProjectData {
  project_insert: Project_Key;
}

export interface GetMediaAssetsByInspectionIdData {
  mediaAssets: ({
    id: UUIDString;
    url: string;
    thumbnailUrl?: string | null;
    type: string;
    description?: string | null;
    captureTimestamp: TimestampString;
    tags?: string[] | null;
  } & MediaAsset_Key)[];
}

export interface GetMediaAssetsByInspectionIdVariables {
  inspectionId: UUIDString;
}

export interface InspectionForm_Key {
  id: UUIDString;
  __typename?: 'InspectionForm_Key';
}

export interface Inspection_Key {
  id: UUIDString;
  __typename?: 'Inspection_Key';
}

export interface ListAllProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    location?: string | null;
    createdAt: TimestampString;
  } & Project_Key)[];
}

export interface MediaAsset_Key {
  id: UUIDString;
  __typename?: 'MediaAsset_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface Report_Key {
  id: UUIDString;
  __typename?: 'Report_Key';
}

export interface UpdateInspectionStatusData {
  inspection_update?: Inspection_Key | null;
}

export interface UpdateInspectionStatusVariables {
  id: UUIDString;
  status: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewProjectRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateNewProjectData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateNewProjectData, undefined>;
  operationName: string;
}
export const createNewProjectRef: CreateNewProjectRef;

export function createNewProject(): MutationPromise<CreateNewProjectData, undefined>;
export function createNewProject(dc: DataConnect): MutationPromise<CreateNewProjectData, undefined>;

interface ListAllProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllProjectsData, undefined>;
  operationName: string;
}
export const listAllProjectsRef: ListAllProjectsRef;

export function listAllProjects(): QueryPromise<ListAllProjectsData, undefined>;
export function listAllProjects(dc: DataConnect): QueryPromise<ListAllProjectsData, undefined>;

interface UpdateInspectionStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInspectionStatusVariables): MutationRef<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateInspectionStatusVariables): MutationRef<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
  operationName: string;
}
export const updateInspectionStatusRef: UpdateInspectionStatusRef;

export function updateInspectionStatus(vars: UpdateInspectionStatusVariables): MutationPromise<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
export function updateInspectionStatus(dc: DataConnect, vars: UpdateInspectionStatusVariables): MutationPromise<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;

interface GetMediaAssetsByInspectionIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMediaAssetsByInspectionIdVariables): QueryRef<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMediaAssetsByInspectionIdVariables): QueryRef<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
  operationName: string;
}
export const getMediaAssetsByInspectionIdRef: GetMediaAssetsByInspectionIdRef;

export function getMediaAssetsByInspectionId(vars: GetMediaAssetsByInspectionIdVariables): QueryPromise<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
export function getMediaAssetsByInspectionId(dc: DataConnect, vars: GetMediaAssetsByInspectionIdVariables): QueryPromise<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;

