import './App.css';
import React from 'react';
import {BrowserRouter as Router, Switch} from 'react-router-dom';
import { Route } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Logout from './components/Logout';

// Forgot password
import ForgotPassword from './components/ForgotPassword';
//Reset Password
import PasswordReset from './components/PasswordReset';
// Not found section
import NotFound from './components/NotFound';

// Messaging area
import UserChat from './components/user/UserChat';

// User Profile area
import UserProfile from './components/user/UserProfile';

// Group Messaging area
import GroupChat from './components/group/GroupChat';

// Group Messaging area
import CreateGroup from './components/group/CreateGroup';

function App() {
  return (
    <Router>
        <div className="App">
            <Switch>  
                  {/* Forms */}
                  <Route exact path="/"                             component={RegisterForm} />

                  <Route path="/LoginForm"                          component={LoginForm} />

                  {/* Additional functionalities */}
                  <Route path="/ForgotPassword"                     component={ForgotPassword} />
                  
                  <Route path="/PasswordReset"                      component={PasswordReset} />

                  {/* Messaging Area */}
                  <Route path="/UserChat"                           component={UserChat} />

                  {/* User Profile Area */}
                   <Route path="/UserProfile"                       component={UserProfile} />

                  {/* Group Messaging Area */}
                  <Route path="/GroupChat"                          component={GroupChat} />

                  {/* Create Group Area */}
                  <Route path="/CreateGroup"                        component={CreateGroup} />

                  {/* logout button */}
                  <Route path="/Logout"                             component={Logout} />

                  {/* Not found page */}
                  {/* Remember to have he notfound page at the absolute bottom of the app.js file code */}
                  <Route path ="*"                                  component={NotFound} />

            </Switch>
            
        </div>

    </Router>
    
  );
}

export default App;


