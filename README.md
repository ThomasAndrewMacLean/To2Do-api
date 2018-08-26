<a name="top"></a>
# to2do-api v1.0.0

backend for todo app

- [To2Do](#to2do)
	- [Delete A User](#delete-a-user)
	- [Deletes a Todo](#deletes-a-todo)
	- [Get all the users](#get-all-the-users)
	- [Check if user from token is admin](#check-if-user-from-token-is-admin)
	- [Get todoos for a user](#get-todoos-for-a-user)
	- [Confirm emailaddress](#confirm-emailaddress)
	- [Test server](#test-server)
	- [Fallback](#fallback)
	- [Get all todoos](#get-all-todoos)
	- [Add a Todo](#add-a-todo)
	- [Log in a user](#log-in-a-user)
	- [Place google login user in database](#place-google-login-user-in-database)
	- [Sign up a new user](#sign-up-a-new-user)
	- [Toggle status of Todo](#toggle-status-of-todo)
	


# <a name='to2do'></a> To2Do

## <a name='delete-a-user'></a> Delete A User
[Back to top](#top)



	DELETE /admin/deleteUser

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  email | String | <p>Mandatory email.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| &nbsp;&nbsp;&nbsp;&nbsp; mongoResponse. | Object | |

## <a name='deletes-a-todo'></a> Deletes a Todo
[Back to top](#top)



	DELETE /todo

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  id | string | <p>Mandatory id.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  mongo | Object | <p>Returns mongo response.</p>|

## <a name='get-all-the-users'></a> Get all the users
[Back to top](#top)



	GET /admin/allusers

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|





### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  users | Object | <p>A list of all the users</p>|

## <a name='check-if-user-from-token-is-admin'></a> Check if user from token is admin
[Back to top](#top)



	GET /admin/isadmin

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|





### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  admin | Object | <p>A Boolean</p>|

## <a name='get-todoos-for-a-user'></a> Get todoos for a user
[Back to top](#top)



	POST /admin/todoForUser

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  email | String | <p>Mandatory email.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  todoos | Object | <p>A list of all the todoos</p>|

## <a name='confirm-emailaddress'></a> Confirm emailaddress
[Back to top](#top)



	GET /confirm/:encryption





### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  encryption | String | <p>.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  index | Page | <p>it returns a HTML page</p>|

## <a name='test-server'></a> Test server
[Back to top](#top)



	GET /ping






### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  pong | String | <p>Always returns pong</p>|

## <a name='fallback'></a> Fallback
[Back to top](#top)



	GET /*






### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  message | string | <p>Path not found...</p>|

## <a name='get-all-todoos'></a> Get all todoos
[Back to top](#top)



	GET /todoos

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|





### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  todoos | Object | <p>List of all the todoos</p>|
|  user | string | <p>The user's name or email.</p>|

## <a name='add-a-todo'></a> Add a Todo
[Back to top](#top)



	POST /addtodo

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  todo | String | <p>Mandatory todo.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  todo | Object | <p>Returns the Todo.</p>|

## <a name='log-in-a-user'></a> Log in a user
[Back to top](#top)



	POST /login





### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  email | String | <p>Mandatory email.</p>|
|  password | String | <p>Mandatory password.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  token | String | <p>It returns a JWT</p>|

## <a name='place-google-login-user-in-database'></a> Place google login user in database
[Back to top](#top)



	POST /loginGoogle

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Google Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  name | String | <p>Mandatory name.</p>|




## <a name='sign-up-a-new-user'></a> Sign up a new user
[Back to top](#top)



	POST /signup





### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  email | String | <p>Mandatory email.</p>|
|  password | String | <p>Mandatory password.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  token | String | <p>It returns a JWT</p>|

## <a name='toggle-status-of-todo'></a> Toggle status of Todo
[Back to top](#top)



	POST /toggleDone

### Headers

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| Authorization | String | <p>Token</p>|




### Parameter Parameters

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  id | string | <p>Mandatory id.</p>|
|  done | boolean | <p>Mandatory done.</p>|



### Success 200

| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
|  mongo | Object | <p>Returns mongo response.</p>|

