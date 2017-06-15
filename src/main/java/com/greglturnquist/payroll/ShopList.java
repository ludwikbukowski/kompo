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

import com.greglturnquist.payroll.Manager;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.Authentication;

import javax.persistence.*;
import java.util.HashSet;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Set;


// tag::code[]
@Data
@Entity
public class ShopList {

	private @Id @GeneratedValue(strategy=GenerationType.AUTO) Long id;
	private String name;
	private String description;

	private @Version @JsonIgnore Long version;

	public void setManagers(Set<Manager> managers) {

		this.managers = managers;
	}

	private @ManyToMany
	Set<Manager> managers = new HashSet<>();

//	@PrePersist @PreUpdate
//	public void prePersist() {
//		managers = new HashSet<>();
//		managers.add((Manager)SecurityContextHolder.getContext().getAuthentication().getPrincipal());
//	}
//

	public ShopList() {
	}

	public ShopList(String name, String description, HashSet<Manager> managers) {
		this.name = name;
		this.description = description;
		this.managers = managers;
	}
	public ShopList(String name, String description) {
		this.name = name;
		this.description = description;
	}

}
// end::code[]