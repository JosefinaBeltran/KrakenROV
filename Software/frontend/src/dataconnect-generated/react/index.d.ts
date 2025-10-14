import { CreateNewProjectData, ListAllProjectsData, UpdateInspectionStatusData, UpdateInspectionStatusVariables, GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateNewProject(options?: useDataConnectMutationOptions<CreateNewProjectData, FirebaseError, void>): UseDataConnectMutationResult<CreateNewProjectData, undefined>;
export function useCreateNewProject(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewProjectData, FirebaseError, void>): UseDataConnectMutationResult<CreateNewProjectData, undefined>;

export function useListAllProjects(options?: useDataConnectQueryOptions<ListAllProjectsData>): UseDataConnectQueryResult<ListAllProjectsData, undefined>;
export function useListAllProjects(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllProjectsData>): UseDataConnectQueryResult<ListAllProjectsData, undefined>;

export function useUpdateInspectionStatus(options?: useDataConnectMutationOptions<UpdateInspectionStatusData, FirebaseError, UpdateInspectionStatusVariables>): UseDataConnectMutationResult<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
export function useUpdateInspectionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateInspectionStatusData, FirebaseError, UpdateInspectionStatusVariables>): UseDataConnectMutationResult<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;

export function useGetMediaAssetsByInspectionId(vars: GetMediaAssetsByInspectionIdVariables, options?: useDataConnectQueryOptions<GetMediaAssetsByInspectionIdData>): UseDataConnectQueryResult<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
export function useGetMediaAssetsByInspectionId(dc: DataConnect, vars: GetMediaAssetsByInspectionIdVariables, options?: useDataConnectQueryOptions<GetMediaAssetsByInspectionIdData>): UseDataConnectQueryResult<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
