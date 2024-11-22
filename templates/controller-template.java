{{{fileComment}}}

package {{packageQualifiedName}};

import {{entityClassQualifiedName}};
import {{servicePackage}}.{{entityClassName}}Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Transactional
@RestController
@RequestMapping("/{{entityClassRequestMapping}}")
public class {{entityClassName}}Controller {
    private static final Logger logger = LoggerFactory.getLogger({{entityClassName}}Controller.class);

    private final {{entityClassName}}Service service;

    @Autowired
    public {{entityClassName}}Controller({{entityClassName}}Service service) {
        this.service = service;
    }

    @GetMapping
    public Iterable<{{entityClassName}}> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public {{entityClassName}} findOne(@PathVariable("id") {{primaryKeyType}} id) {
        return service.findOne(id);
    }

    @PostMapping
    public {{entityClassName}} create(@RequestBody @Valid {{entityClassName}} entity) {
        return service.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable {{primaryKeyType}} id) {
        service.delete(id);
    }
}