- 1x = Front end errors
    - 11x = Nonce Verification
    - 12x = Permissions
    - 13x = Saving Data
    - 14x = Processing Data
- 2x = Admin page/Backend errors
- 3x = API errors

| Code | Page | Type | Description |
|:----:|:-----|:-----|:------------|
| 12001 | My Account - My Information - Change Name | Permissions | User does not have change_name permission on GET |
| 11001 | My Account - My Information - Change Name | Nonce Verification | Nonce verification promise rejection |
| 11002 | My Account - My Information - Change Name | Nonce Verification | Nonce verification promise result false |
| 12002 | My Account - My Information - Change Name | Permissions | User does not have change_name permission on POST |
| 13001 | My Account - My Information - Change Name | Saving Data | User.saveUser() promise rejection |
| 13002 | My Account - My Information - Change Name | Saving Data | User.saveUser() promise result false |
| 12003 | My Account - My Information - Change Username | Permissions | User does not have change_username permission on GET |
| 11003 | My Account - My Information - Change Username | Nonce Verification | Nonce verification promise rejection |
| 11004 | My Account - My Information - Change Username | Nonce Verification | Nonce verification promise result false |
| 12004 | My Account - My Information - Change Username | Permissions | User does not have change_username permission on POST |
| 13003 | My Account - My Information - Change Username | Saving Data | User.saveUser() promise rejection |
| 13004 | My Account - My Information - Change Username | Saving Data | User.saveUser() promise result false |
| 12005 | My Account - My Information - Change DOB | Permissions | User does not have change_dob permission on GET |
| 11005 | My Account - My Information - Change DOB | Nonce Verification | Nonce verification promise rejection |
| 11006 | My Account - My Information - Change DOB | Nonce Verification | Nonce verification promise result false |
| 12006 | My Account - My Information - Change DOB | Permissions | User does not have change_dob permission on POST |
| 13005 | My Account - My Information - Change DOB | Saving Data | User.saveUser() promise rejection |
| 13006 | My Account - My Information - Change DOB | Saving Data | User.saveUser() promise result false |
| 11007 | My Account - Security - Change Password | Nonce Verification | Nonce verification promise rejection |
| 11008 | My Account - Security - Change Password | Nonce Verification | Nonce verification promise result false |
| 13007 | My Account - Security - Change Password | Saving Data | Cannot read password from database |
| 13008 | My Account - Security - Change Password | Saving Data | Current password is incorrect |
| 13009 | My Account - Security - Change Password | Saving Data | Auth.encryptPassword() promise rejection |
| 13010 | My Account - Security - Change Password | Saving Data | Auth.savePasswordToDatabase() promise rejection |
| 13011 | My Account - Security - Change Password | Saving Data | Auth.savePasswordToDatabase() promise result false |
| 11009 | My Account - Security - Logout Everywhere All Devices | Nonce Verification | Nonce verification promise rejection |
| 11010 | My Account - Security - Logout Everywhere All Devices | Nonce Verification | Nonce verification promise result false |
| 13012 | My Account - Security - Logout Everywhere All Devices | Saving Data | accessToken.deleteUserTokens() promise rejection |
| 13013 | My Account - Security - Logout Everywhere All Devices | Saving Data | accessToken.deleteUserTokens promise result false |
| 11011 | My Account - Security - Logout Everywhere Other Devices | Nonce Verification | Nonce verification promise rejection |
| 11012 | My Account - Security - Logout Everywhere Other Devices | Nonce Verification | Nonce verification promise result false |
| 13014 | My Account - Security - Logout Everywhere Other Devices | Saving Data | accessToken.deleteUserTokens() promise rejection |
| 13015 | My Account - Security - Logout Everywhere Other Devices | Saving Data | accessToken.deleteUserTokens promise result false |