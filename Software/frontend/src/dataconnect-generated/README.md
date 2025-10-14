# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAllProjects*](#listallprojects)
  - [*GetMediaAssetsByInspectionId*](#getmediaassetsbyinspectionid)
- [**Mutations**](#mutations)
  - [*CreateNewProject*](#createnewproject)
  - [*UpdateInspectionStatus*](#updateinspectionstatus)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAllProjects
You can execute the `ListAllProjects` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllProjects(): QueryPromise<ListAllProjectsData, undefined>;

interface ListAllProjectsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllProjectsData, undefined>;
}
export const listAllProjectsRef: ListAllProjectsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllProjects(dc: DataConnect): QueryPromise<ListAllProjectsData, undefined>;

interface ListAllProjectsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllProjectsData, undefined>;
}
export const listAllProjectsRef: ListAllProjectsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllProjectsRef:
```typescript
const name = listAllProjectsRef.operationName;
console.log(name);
```

### Variables
The `ListAllProjects` query has no variables.
### Return Type
Recall that executing the `ListAllProjects` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllProjectsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    location?: string | null;
    createdAt: TimestampString;
  } & Project_Key)[];
}
```
### Using `ListAllProjects`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllProjects } from '@dataconnect/generated';


// Call the `listAllProjects()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllProjects();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllProjects(dataConnect);

console.log(data.projects);

// Or, you can use the `Promise` API.
listAllProjects().then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

### Using `ListAllProjects`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllProjectsRef } from '@dataconnect/generated';


// Call the `listAllProjectsRef()` function to get a reference to the query.
const ref = listAllProjectsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllProjectsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.projects);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.projects);
});
```

## GetMediaAssetsByInspectionId
You can execute the `GetMediaAssetsByInspectionId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMediaAssetsByInspectionId(vars: GetMediaAssetsByInspectionIdVariables): QueryPromise<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;

interface GetMediaAssetsByInspectionIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMediaAssetsByInspectionIdVariables): QueryRef<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
}
export const getMediaAssetsByInspectionIdRef: GetMediaAssetsByInspectionIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMediaAssetsByInspectionId(dc: DataConnect, vars: GetMediaAssetsByInspectionIdVariables): QueryPromise<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;

interface GetMediaAssetsByInspectionIdRef {
  ...
  (dc: DataConnect, vars: GetMediaAssetsByInspectionIdVariables): QueryRef<GetMediaAssetsByInspectionIdData, GetMediaAssetsByInspectionIdVariables>;
}
export const getMediaAssetsByInspectionIdRef: GetMediaAssetsByInspectionIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMediaAssetsByInspectionIdRef:
```typescript
const name = getMediaAssetsByInspectionIdRef.operationName;
console.log(name);
```

### Variables
The `GetMediaAssetsByInspectionId` query requires an argument of type `GetMediaAssetsByInspectionIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMediaAssetsByInspectionIdVariables {
  inspectionId: UUIDString;
}
```
### Return Type
Recall that executing the `GetMediaAssetsByInspectionId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMediaAssetsByInspectionIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMediaAssetsByInspectionId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMediaAssetsByInspectionId, GetMediaAssetsByInspectionIdVariables } from '@dataconnect/generated';

// The `GetMediaAssetsByInspectionId` query requires an argument of type `GetMediaAssetsByInspectionIdVariables`:
const getMediaAssetsByInspectionIdVars: GetMediaAssetsByInspectionIdVariables = {
  inspectionId: ..., 
};

// Call the `getMediaAssetsByInspectionId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMediaAssetsByInspectionId(getMediaAssetsByInspectionIdVars);
// Variables can be defined inline as well.
const { data } = await getMediaAssetsByInspectionId({ inspectionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMediaAssetsByInspectionId(dataConnect, getMediaAssetsByInspectionIdVars);

console.log(data.mediaAssets);

// Or, you can use the `Promise` API.
getMediaAssetsByInspectionId(getMediaAssetsByInspectionIdVars).then((response) => {
  const data = response.data;
  console.log(data.mediaAssets);
});
```

### Using `GetMediaAssetsByInspectionId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMediaAssetsByInspectionIdRef, GetMediaAssetsByInspectionIdVariables } from '@dataconnect/generated';

// The `GetMediaAssetsByInspectionId` query requires an argument of type `GetMediaAssetsByInspectionIdVariables`:
const getMediaAssetsByInspectionIdVars: GetMediaAssetsByInspectionIdVariables = {
  inspectionId: ..., 
};

// Call the `getMediaAssetsByInspectionIdRef()` function to get a reference to the query.
const ref = getMediaAssetsByInspectionIdRef(getMediaAssetsByInspectionIdVars);
// Variables can be defined inline as well.
const ref = getMediaAssetsByInspectionIdRef({ inspectionId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMediaAssetsByInspectionIdRef(dataConnect, getMediaAssetsByInspectionIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.mediaAssets);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.mediaAssets);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewProject
You can execute the `CreateNewProject` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewProject(): MutationPromise<CreateNewProjectData, undefined>;

interface CreateNewProjectRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateNewProjectData, undefined>;
}
export const createNewProjectRef: CreateNewProjectRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewProject(dc: DataConnect): MutationPromise<CreateNewProjectData, undefined>;

interface CreateNewProjectRef {
  ...
  (dc: DataConnect): MutationRef<CreateNewProjectData, undefined>;
}
export const createNewProjectRef: CreateNewProjectRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewProjectRef:
```typescript
const name = createNewProjectRef.operationName;
console.log(name);
```

### Variables
The `CreateNewProject` mutation has no variables.
### Return Type
Recall that executing the `CreateNewProject` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewProjectData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewProjectData {
  project_insert: Project_Key;
}
```
### Using `CreateNewProject`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewProject } from '@dataconnect/generated';


// Call the `createNewProject()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewProject();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewProject(dataConnect);

console.log(data.project_insert);

// Or, you can use the `Promise` API.
createNewProject().then((response) => {
  const data = response.data;
  console.log(data.project_insert);
});
```

### Using `CreateNewProject`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewProjectRef } from '@dataconnect/generated';


// Call the `createNewProjectRef()` function to get a reference to the mutation.
const ref = createNewProjectRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewProjectRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.project_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.project_insert);
});
```

## UpdateInspectionStatus
You can execute the `UpdateInspectionStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateInspectionStatus(vars: UpdateInspectionStatusVariables): MutationPromise<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;

interface UpdateInspectionStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateInspectionStatusVariables): MutationRef<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
}
export const updateInspectionStatusRef: UpdateInspectionStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateInspectionStatus(dc: DataConnect, vars: UpdateInspectionStatusVariables): MutationPromise<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;

interface UpdateInspectionStatusRef {
  ...
  (dc: DataConnect, vars: UpdateInspectionStatusVariables): MutationRef<UpdateInspectionStatusData, UpdateInspectionStatusVariables>;
}
export const updateInspectionStatusRef: UpdateInspectionStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateInspectionStatusRef:
```typescript
const name = updateInspectionStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateInspectionStatus` mutation requires an argument of type `UpdateInspectionStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateInspectionStatusVariables {
  id: UUIDString;
  status: string;
}
```
### Return Type
Recall that executing the `UpdateInspectionStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateInspectionStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateInspectionStatusData {
  inspection_update?: Inspection_Key | null;
}
```
### Using `UpdateInspectionStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateInspectionStatus, UpdateInspectionStatusVariables } from '@dataconnect/generated';

// The `UpdateInspectionStatus` mutation requires an argument of type `UpdateInspectionStatusVariables`:
const updateInspectionStatusVars: UpdateInspectionStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateInspectionStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateInspectionStatus(updateInspectionStatusVars);
// Variables can be defined inline as well.
const { data } = await updateInspectionStatus({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateInspectionStatus(dataConnect, updateInspectionStatusVars);

console.log(data.inspection_update);

// Or, you can use the `Promise` API.
updateInspectionStatus(updateInspectionStatusVars).then((response) => {
  const data = response.data;
  console.log(data.inspection_update);
});
```

### Using `UpdateInspectionStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateInspectionStatusRef, UpdateInspectionStatusVariables } from '@dataconnect/generated';

// The `UpdateInspectionStatus` mutation requires an argument of type `UpdateInspectionStatusVariables`:
const updateInspectionStatusVars: UpdateInspectionStatusVariables = {
  id: ..., 
  status: ..., 
};

// Call the `updateInspectionStatusRef()` function to get a reference to the mutation.
const ref = updateInspectionStatusRef(updateInspectionStatusVars);
// Variables can be defined inline as well.
const ref = updateInspectionStatusRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateInspectionStatusRef(dataConnect, updateInspectionStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.inspection_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.inspection_update);
});
```

