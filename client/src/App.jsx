import './App.css';
import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import LoginForm      from './components/LoginForm';
import RegisterForm   from './components/RegisterForm';
import Logout         from './components/Logout';
import ForgotPassword from './components/ForgotPassword';
import PasswordReset  from './components/PasswordReset';
import NotFound       from './components/NotFound';

import UserChat    from './components/user/UserChat';
import UserProfile from './components/user/UserProfile';

import GroupChat     from './components/group/GroupChat';
import CreateGroup   from './components/group/CreateGroup';
import GroupSettings from './components/group/GroupSettings';

import Dashboard from './components/dashboard/Dashboard';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Navbar />

                    <Switch>
                        {/* public routes */}
                        <Route exact path="/"         component={RegisterForm} />
                        <Route path="/LoginForm"       component={LoginForm} />
                        <Route path="/ForgotPassword"  component={ForgotPassword} />
                        <Route path="/PasswordReset"   component={PasswordReset} />

                        {/* protected — redirect to /LoginForm if not authenticated */}
                        <ProtectedRoute path="/UserChat"    component={UserChat} />
                        <ProtectedRoute path="/UserProfile" component={UserProfile} />
                        <ProtectedRoute path="/Dashboard"                component={Dashboard} />
                        <ProtectedRoute path="/GroupChat"               component={GroupChat} />
                        <ProtectedRoute path="/CreateGroup"             component={CreateGroup} />
                        <ProtectedRoute path="/GroupSettings/:groupId"  component={GroupSettings} />
                        <ProtectedRoute path="/Logout"                  component={Logout} />

                        {/* 404 — must stay last */}
                        <Route path="*" component={NotFound} />
                    </Switch>

                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;


