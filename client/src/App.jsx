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

                    <main className="app-content">
                    <Switch>
                        {/* public routes */}
                        <Route exact path="/"           component={RegisterForm} />
                        <Route path="/login"            component={LoginForm} />
                        <Route path="/forgot-password"  component={ForgotPassword} />
                        <Route path="/reset-password"   component={PasswordReset} />

                        {/* protected — redirect to /login if not authenticated */}
                        <ProtectedRoute path="/chat"                    component={UserChat} />
                        <ProtectedRoute path="/profile"                 component={UserProfile} />
                        <ProtectedRoute path="/dashboard"               component={Dashboard} />
                        <ProtectedRoute path="/groups"                  component={GroupChat} />
                        <ProtectedRoute path="/create-group"            component={CreateGroup} />
                        <ProtectedRoute path="/group-settings/:groupId" component={GroupSettings} />
                        <ProtectedRoute path="/logout"                  component={Logout} />

                        {/* 404 — must stay last */}
                        <Route path="*" component={NotFound} />
                    </Switch>
                    </main>

                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
