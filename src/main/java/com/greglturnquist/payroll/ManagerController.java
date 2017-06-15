/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.greglturnquist.payroll;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.greglturnquist.payroll.Manager;
import com.greglturnquist.payroll.ManagerRepository;

/**
 * @author Greg Turnquist
 */
// tag::code[]
@Controller
@RequestMapping(path="/manager")
public class ManagerController {

    @Autowired
    private ManagerRepository managerRepository;

    @GetMapping(path="/add")
    public @ResponseBody String addNewManager (@RequestParam String name
            , @RequestParam String password) {
        // @ResponseBody means the returned String is the response, not a view name
        // @RequestParam means it is a parameter from the GET or POST request

        Manager m = new Manager();
        m.setName(name);
        m.setPassword(password);
        managerRepository.save(m);
        return "Saved";
    }

    @RequestMapping(value = "/managersL")
    public String index() {
        return "index";
    }

    @GetMapping(path="/managers")
    public @ResponseBody Iterable<Manager> getAllManagers() {
        // This returns a JSON or XML with the users
        return managerRepository.findAll();
    }

    //@RequestMapping(value = "/account")
    //public String account() {
        //return "account";
    //}

}
// end::code[]